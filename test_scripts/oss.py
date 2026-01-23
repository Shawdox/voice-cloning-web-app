import oss2
import os

from dotenv import load_dotenv
import hashlib
from pydub import AudioSegment

def detect_leading_silence(sound, silence_threshold=-50.0, chunk_size=10):
    trim_ms = 0
    while trim_ms < len(sound) and sound[trim_ms:trim_ms+chunk_size].dBFS < silence_threshold:
        trim_ms += chunk_size
    return trim_ms

def upload_audio_to_oss(local_file_path: str,
                        bucket_name: str,
                        endpoint: str,
                        access_key_id: str,
                        access_key_secret: str) -> str:
    """
    上传本地音频文件到阿里云 OSS，并返回公网可访问链接

    参数:
        local_file_path: 本地音频文件路径
        bucket_name: OSS 存储空间名称
        endpoint: OSS 访问域名 (如: "https://oss-cn-beijing.aliyuncs.com")
        access_key_id: 阿里云 AccessKey ID
        access_key_secret: 阿里云 AccessKey Secret
        object_name: 上传到 OSS 的对象名 (默认使用本地文件名)

    返回:
        公网可访问的文件 URL
    """

    # 初始化认证
    auth = oss2.Auth(access_key_id, access_key_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    # 处理静音
    try:
        sound = AudioSegment.from_file(local_file_path)
        start_trim = detect_leading_silence(sound)
        end_trim = detect_leading_silence(sound.reverse())
        
        duration = len(sound)
        
        if start_trim >= 1000 or end_trim >= 1000:
            print(f"- Detected silence: Start={start_trim}ms, End={end_trim}ms. Trimming...")
            if start_trim + end_trim < duration:
                trimmed_sound = sound[start_trim:duration-end_trim]
                trimmed_sound.export(local_file_path, format=local_file_path.split('.')[-1])
                print(f"- Trimmed audio saved to {local_file_path}")
            else:
                print("- Audio is mostly silence, skipping trim.")
    except Exception as e:
        print(f"- Warning: Could not process audio for silence trimming: {e}")

    with open(local_file_path, 'rb') as f:
        file_hash = hashlib.md5()
        while chunk := f.read(8192):
            file_hash.update(chunk)
    
    # 获取文件扩展名
    _, ext = os.path.splitext(local_file_path)
    object_name = file_hash.hexdigest() + ext

    # 拼接公网 URL (前提是 bucket 权限为公共读)
    public_url = f"https://{bucket_name}.{endpoint.replace('https://', '')}/{object_name}"

    # 检查文件是否已存在
    if bucket.object_exists(object_name):
        print(f"- File already exists in OSS {object_name}. Skipping upload.")
    else:
        # 上传文件
        with open(local_file_path, 'rb') as fileobj:
            bucket.put_object(object_name, fileobj)
    print(f"- Public URL: {public_url}")
    return public_url


# 使用示例
if __name__ == "__main__":
    
    load_dotenv()
    
    url = upload_audio_to_oss(
        local_file_path="/mnt/c/Users/Shaw/Desktop/web/data/季冠霖语音包.MP3",
        bucket_name=os.getenv("BUCKET_NAME"),
        endpoint="https://oss-cn-beijing.aliyuncs.com",
        access_key_id=os.getenv("OSS_ACCESS_KEY_ID"),
        access_key_secret=os.getenv("OSS_ACCESS_KEY_SECRET")
    )
    print("Public URL: ", url)
