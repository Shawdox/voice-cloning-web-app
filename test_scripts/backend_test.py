import os
import time
import dashscope
from dashscope.audio.tts_v2 import VoiceEnrollmentService, SpeechSynthesizer

from oss import upload_audio_to_oss
import docx
from dotenv import load_dotenv
import traceback
load_dotenv()

def get_text(file):
    if file.endswith('.docx'):
        doc = docx.Document(file)
        return '\n'.join([para.text for para in doc.paragraphs])
    else:
        with open(file, "r", encoding="utf-8") as f:
            return f.read()

dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
if not dashscope.api_key:
    raise ValueError("DASHSCOPE_API_KEY environment variable not set.")


# 1. 上传本地音频文件到 OSS 并获取公网可访问链接
#local_audio_path = "/mnt/c/Users/Shaw/Desktop/web/data/季冠霖语音包.MP3"
local_audio_path = "/mnt/c/Users/Shaw/Desktop/web/data/柱训练篇2集无伴奏版.MP3"
oss_bucket_name = os.getenv("BUCKET_NAME")
oss_endpoint = "https://oss-cn-beijing.aliyuncs.com"
oss_access_key_id = os.getenv("OSS_ACCESS_KEY_ID")
oss_access_key_secret = os.getenv("OSS_ACCESS_KEY_SECRET")

AUDIO_URL = upload_audio_to_oss(
    local_file_path=local_audio_path,
    bucket_name=oss_bucket_name,
    endpoint=oss_endpoint,
    access_key_id=oss_access_key_id,
    access_key_secret=oss_access_key_secret
)


# 2. 定义复刻参数
#TARGET_MODEL = "cosyvoice-v3-plus" 
TARGET_MODEL = "qwen3-tts-vc-realtime-2025-11-27"
# 为音色起一个有意义的前缀
VOICE_PREFIX = "wxtest" # 仅允许数字和小写字母，小于十个字符

# 3. 创建音色 (异步任务)
print("\n--- Step 1: Creating voice enrollment ---")
service = VoiceEnrollmentService()
try:
    voice_id = service.create_voice(
        target_model=TARGET_MODEL,
        prefix=VOICE_PREFIX,
        url=AUDIO_URL,
        language_hints=["ja"],
    )
    print(f"Voice enrollment submitted successfully. Request ID: {service.get_last_request_id()}")
    print(f"Generated Voice ID: {voice_id}")
except Exception as e:
    print(f"Error during voice creation: {e}")
    raise e
# 4. 轮询查询音色状态
print("\n--- Step 2: Polling for voice status ---")
max_attempts = 30
poll_interval = 10 # 秒
for attempt in range(max_attempts):
    try:
        voice_info = service.query_voice(voice_id=voice_id)
        status = voice_info.get("status")
        #usage = voice_info.get("usage", {})
        print(f"Attempt {attempt + 1}/{max_attempts}: Voice status is '{status}'")
        
        if status == "OK":
            print("Voice is ready for synthesis.")
            #print(f"Voice creation usage: {usage}")
            break
        elif status == "UNDEPLOYED":
            print(f"Voice processing failed with status: {status}. Please check audio quality or contact support.")
            raise RuntimeError(f"Voice processing failed with status: {status}")
        # 对于 "DEPLOYING" 等中间状态，继续等待
        time.sleep(poll_interval)
    except Exception as e:
        print(f"Error during status polling: {e}")
        time.sleep(poll_interval)
else:
    print("Polling timed out. The voice is not ready after several attempts.")
    raise RuntimeError("Polling timed out. The voice is not ready after several attempts.")

# 5. 使用复刻音色进行语音合成
print("\n--- Step 3: Synthesizing speech with the new voice ---")
try:
    synthesizer = SpeechSynthesizer(model=TARGET_MODEL, 
                                    voice="cosyvoice-v3-plus-wxtest-b19cea0c51944a688b207f7b6570729b", 
                                    language_hints=["ja"],
                                    #instruction="你说话的情感是sad。",
                                    )
    input_text = get_text('/mnt/c/Users/Shaw/Desktop/web/data/input.txt')
    #text_to_synthesize = "恭喜，已成功复刻并合成了属于自己的声音！"
    
    # call()方法返回二进制音频数据
    audio_data = synthesizer.call(input_text)
    if audio_data is None:
        raise RuntimeError("Speech synthesis failed, no audio data returned.")
    print(f"Speech synthesis successful. Request ID: {synthesizer.get_last_request_id()}")

    # 6. 保存音频文件
    output_file = "my_custom_voice_output.mp3"
    with open(output_file, "wb") as f:
        f.write(audio_data)
    print(f"Audio saved to {output_file}")

except Exception as e:
    traceback.print_exc()
    print(f"Error during speech synthesis: {e}")