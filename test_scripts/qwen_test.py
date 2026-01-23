# DashScope SDK 版本需要不低于1.23.9，Python版本需3.10及以上
# coding=utf-8
# Installation instructions for pyaudio:
# APPLE Mac OS X
#   brew install portaudio
#   pip install pyaudio
# Debian/Ubuntu
#   sudo apt-get install python-pyaudio python3-pyaudio
#   or
#   pip install pyaudio
# CentOS
#   sudo yum install -y portaudio portaudio-devel && pip install pyaudio
# Microsoft Windows
#   python -m pip install pyaudio

import pyaudio
import os
import requests
import base64
import pathlib
import threading
import time
import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback, AudioFormat
from dashscope.audio.tts_v2 import VoiceEnrollmentService
from dotenv import load_dotenv
from oss import upload_audio_to_oss

# ======= 常量配置 =======
DEFAULT_TARGET_MODEL = "qwen3-tts-vc-realtime-2025-11-27"
VOICE_PREFIX = "qwen_realtime_test"
# 本地音频文件路径
LOCAL_AUDIO_PATH = "/mnt/c/Users/Shaw/Desktop/web/data/柱训练篇2集无伴奏版.MP3"

TEXT_TO_SYNTHESIZE = [
    '对吧~我就特别喜欢这种超市，',
    '尤其是过年的时候',
    '去逛超市',
    '就会觉得',
    '超级超级开心！',
    '想买好多好多的东西呢！'
]

def prepare_voice_id():
    """
    上传音频 -> 创建音色 -> 轮询状态 -> 返回 voice_id
    """
    # 1. 上传本地音频文件到 OSS
    print("--- Step 1: Uploading audio to OSS ---")
    oss_bucket_name = os.getenv("BUCKET_NAME")
    oss_endpoint = "https://oss-cn-beijing.aliyuncs.com"
    oss_access_key_id = os.getenv("OSS_ACCESS_KEY_ID")
    oss_access_key_secret = os.getenv("OSS_ACCESS_KEY_SECRET")

    audio_url = upload_audio_to_oss(
        local_file_path=LOCAL_AUDIO_PATH,
        bucket_name=oss_bucket_name,
        endpoint=oss_endpoint,
        access_key_id=oss_access_key_id,
        access_key_secret=oss_access_key_secret
    )
    print(f"Audio uploaded to: {audio_url}")

    # 2. 创建音色
    print("\n--- Step 2: Creating voice enrollment ---")
    service = VoiceEnrollmentService()
    try:
        voice_id = service.create_voice(
            target_model=DEFAULT_TARGET_MODEL,
            prefix=VOICE_PREFIX,
            url=audio_url,
            language_hints=["ja"], # 根据实际音频语言调整
        )
        print(f"Voice enrollment submitted. Request ID: {service.get_last_request_id()}")
        print(f"Generated Voice ID: {voice_id}")
    except Exception as e:
        print(f"Error during voice creation: {e}")
        raise e

    # 3. 轮询状态
    print("\n--- Step 3: Polling for voice status ---")
    max_attempts = 30
    poll_interval = 10
    for attempt in range(max_attempts):
        try:
            voice_info = service.query_voice(voice_id=voice_id)
            status = voice_info.get("status")
            print(f"Attempt {attempt + 1}/{max_attempts}: Voice status is '{status}'")
            
            if status == "OK":
                print("Voice is ready.")
                return voice_id
            elif status == "UNDEPLOYED":
                raise RuntimeError(f"Voice processing failed: {status}")
            time.sleep(poll_interval)
        except Exception as e:
            print(f"Error polling status: {e}")
            time.sleep(poll_interval)
    
    raise RuntimeError("Polling timed out.")

def init_dashscope_api_key():
    """
    初始化 dashscope SDK 的 API key
    """
    # 新加坡和北京地域的API Key不同。获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
    # 若没有配置环境变量，请用百炼API Key将下行替换为：dashscope.api_key = "sk-xxx"
    dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")

# ======= 回调类 =======
class MyCallback(QwenTtsRealtimeCallback):
    """
    自定义 TTS 流式回调
    """
    def __init__(self):
        self.complete_event = threading.Event()
        self._player = pyaudio.PyAudio()
        self._stream = self._player.open(
            format=pyaudio.paInt16, channels=1, rate=24000, output=True
        )

    def on_open(self) -> None:
        print('[TTS] 连接已建立')

    def on_close(self, close_status_code, close_msg) -> None:
        self._stream.stop_stream()
        self._stream.close()
        self._player.terminate()
        print(f'[TTS] 连接关闭 code={close_status_code}, msg={close_msg}')

    def on_event(self, response: dict) -> None:
        try:
            event_type = response.get('type', '')
            if event_type == 'session.created':
                print(f'[TTS] 会话开始: {response["session"]["id"]}')
            elif event_type == 'response.audio.delta':
                audio_data = base64.b64decode(response['delta'])
                self._stream.write(audio_data)
            elif event_type == 'response.done':
                print(f'[TTS] 响应完成, Response ID: {qwen_tts_realtime.get_last_response_id()}')
            elif event_type == 'session.finished':
                print('[TTS] 会话结束')
                self.complete_event.set()
        except Exception as e:
            print(f'[Error] 处理回调事件异常: {e}')

    def wait_for_finished(self):
        self.complete_event.wait()

# ======= 主执行逻辑 =======
if __name__ == '__main__':
    load_dotenv()
    init_dashscope_api_key()
    
    # 获取复刻后的 voice_id
    voice_id = prepare_voice_id()
    
    print('\n[系统] 初始化 Qwen TTS Realtime ...')

    callback = MyCallback()
    qwen_tts_realtime = QwenTtsRealtime(
        model=DEFAULT_TARGET_MODEL,
        callback=callback,
        # 以下为北京地域url，若使用新加坡地域的模型，需将url替换为：wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime
        url='wss://dashscope.aliyuncs.com/api-ws/v1/realtime'
    )
    qwen_tts_realtime.connect()
    
    qwen_tts_realtime.update_session(
        voice=voice_id, 
        response_format=AudioFormat.PCM_24000HZ_MONO_16BIT,
        mode='server_commit'
    )

    for text_chunk in TEXT_TO_SYNTHESIZE:
        print(f'[发送文本]: {text_chunk}')
        qwen_tts_realtime.append_text(text_chunk)
        time.sleep(0.1)

    qwen_tts_realtime.finish()
    callback.wait_for_finished()

    print(f'[Metric] session_id={qwen_tts_realtime.get_session_id()}, '
          f'first_audio_delay={qwen_tts_realtime.get_first_audio_delay()}s')