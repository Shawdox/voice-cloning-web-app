#!/usr/bin/env python3
"""
调试脚本：检查预定义音色API为什么返回空数据
"""
import requests
import json

BASE_URL = "http://localhost:8080"
USER_EMAIL = "xiaowu.417@qq.com"
USER_PASSWORD = "1234qwer"

def login():
    """登录获取token"""
    print("1. 登录系统...")
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"login_id": USER_EMAIL, "password": USER_PASSWORD}
    )

    if response.status_code == 200:
        data = response.json()
        token = data.get("token")
        print(f"✅ 登录成功，token: {token[:20]}...")
        return token
    else:
        print(f"❌ 登录失败: {response.status_code} - {response.text}")
        return None

def check_predefined_voices(token):
    """检查预定义音色API"""
    print("\n2. 调用预定义音色API...")
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        f"{BASE_URL}/api/v1/voices/predefined",
        headers=headers
    )

    print(f"   状态码: {response.status_code}")
    print(f"   响应头: {dict(response.headers)}")

    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ API调用成功")
        print(f"   响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")

        if "data" in data:
            voices = data["data"]
            print(f"\n   预定义音色数量: {len(voices)}")
            if len(voices) == 0:
                print("   ⚠️ 警告: 返回了空数组！")
                print("   可能原因:")
                print("   1. Fish API密钥未配置或无效")
                print("   2. Fish Audio API无法访问")
                print("   3. 后端服务配置错误")
            else:
                print("   音色列表:")
                for i, voice in enumerate(voices, 1):
                    print(f"   {i}. {voice.get('name')} ({voice.get('language')}-{voice.get('gender')})")
        else:
            print(f"   ⚠️ 响应格式异常: {data}")
    else:
        print(f"❌ API调用失败: {response.status_code}")
        print(f"   错误信息: {response.text}")

def check_backend_logs():
    """提示检查后端日志"""
    print("\n3. 检查后端日志...")
    print("   请在后端终端查看是否有以下错误:")
    print("   - 'Fish API error'")
    print("   - 'Failed to fetch predefined voices'")
    print("   - 网络连接错误")

def check_fish_api_config():
    """检查Fish API配置"""
    print("\n4. 检查Fish API配置...")
    print("   请确认以下环境变量已设置:")
    print("   - FISH_API_KEY: Fish Audio API密钥")
    print("   - FISH_API_BASE_URL: https://api.fish.audio (可选)")
    print("\n   如何获取Fish API密钥:")
    print("   1. 访问 https://fish.audio")
    print("   2. 注册/登录账号")
    print("   3. 进入 API 设置页面")
    print("   4. 生成新的API密钥")
    print("\n   配置方法:")
    print("   在项目根目录创建 .env 文件，添加:")
    print("   FISH_API_KEY=your_api_key_here")

if __name__ == "__main__":
    print("="*70)
    print("预定义音色API调试脚本")
    print("="*70)

    token = login()
    if token:
        check_predefined_voices(token)
        check_backend_logs()
        check_fish_api_config()

    print("\n" + "="*70)
    print("调试完成")
    print("="*70)
