"""
通过API直接清理测试数据
更快速且可靠
"""
import requests
import json

BASE_API_URL = "http://localhost:8080/api/v1"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def login():
    """Login and get token"""
    response = requests.post(f"{BASE_API_URL}/auth/login", json={
        "login_id": USER_EMAIL,
        "password": USER_PASSWORD
    })
    
    if response.status_code == 200:
        token = response.json()['token']
        print(f"✓ Logged in successfully")
        return token
    else:
        print(f"✗ Login failed: {response.text}")
        return None

def cleanup_data(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n" + "="*60)
    print("开始清理测试数据...")
    print("="*60)
    
    # 1. Delete all TTS history
    print("\n[1/3] 清理TTS生成历史...")
    response = requests.get(f"{BASE_API_URL}/tts", headers=headers)
    if response.status_code == 200:
        tasks = response.json()['data']
        print(f"  Found {len(tasks)} TTS tasks")
        
        for task in tasks:
            delete_response = requests.delete(f"{BASE_API_URL}/tts/{task['id']}", headers=headers)
            if delete_response.status_code == 200:
                print(f"  ✓ Deleted TTS task {task['id']}")
            else:
                print(f"  ✗ Failed to delete TTS task {task['id']}")
    
    # 2. Delete all uploaded files
    print("\n[2/3] 清理已上传的音频文件...")
    response = requests.get(f"{BASE_API_URL}/upload/audio", headers=headers)
    if response.status_code == 200:
        files = response.json()
        print(f"  Found {len(files)} uploaded files")
        
        for file in files:
            delete_response = requests.delete(f"{BASE_API_URL}/upload/audio/{file['id']}", headers=headers)
            if delete_response.status_code == 200:
                print(f"  ✓ Deleted file {file['filename']}")
            else:
                print(f"  ✗ Failed to delete file {file['id']}")
    
    # 3. Delete all user voices
    print("\n[3/3] 清理用户音色...")
    response = requests.get(f"{BASE_API_URL}/voices?page=1&pageSize=100", headers=headers)
    if response.status_code == 200:
        voices = response.json()['data']
        print(f"  Found {len(voices)} voices")
        
        for voice in voices:
            delete_response = requests.delete(f"{BASE_API_URL}/voices/{voice['id']}", headers=headers)
            if delete_response.status_code == 200:
                print(f"  ✓ Deleted voice {voice['name']}")
            else:
                print(f"  ✗ Failed to delete voice {voice['id']}")
    
    print("\n" + "="*60)
    print("✅ 清理完成!")
    print("="*60)

def main():
    token = login()
    if not token:
        print("Failed to login, cannot cleanup")
        return
    
    cleanup_data(token)
    
    # Also clean up log files
    print("\n[Bonus] 清理日志文件...")
    import subprocess
    try:
        subprocess.run("rm -f tests/*.log tests/*.png tests/*.html 2>/dev/null", shell=True)
        print("  ✓ Log files cleaned")
    except:
        pass

if __name__ == "__main__":
    main()
