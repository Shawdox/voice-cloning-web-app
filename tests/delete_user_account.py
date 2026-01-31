#!/usr/bin/env python3
"""
Delete a user account and verify backend cleanup.

Steps:
1) Optional API cleanup (delete TTS, uploaded files, voices) to trigger OSS removal.
2) Hard delete user-related DB records.
3) Verify user and related records are removed.
"""

import argparse
import os
import subprocess
import sys
import requests


BASE_API_URL = os.getenv("BASE_API_URL", "http://localhost:8080/api/v1")


def run_psql(sql: str) -> str:
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "voice_clone_db")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")

    conn = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    cmd = ["psql", conn, "-t", "-A", "-c", sql]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def get_user_id(email: str):
    safe_email = email.replace("'", "''")
    output = run_psql(f"SELECT id FROM users WHERE email = '{safe_email}';")
    if not output:
        return None
    return int(output)


def login(email: str, password: str):
    response = requests.post(
        f"{BASE_API_URL}/auth/login",
        json={"login_id": email, "password": password},
        timeout=10,
    )
    if response.status_code == 200:
        return response.json().get("token")
    return None


def cleanup_via_api(token: str):
    headers = {"Authorization": f"Bearer {token}"}

    tts_resp = requests.get(f"{BASE_API_URL}/tts", headers=headers, timeout=10)
    if tts_resp.status_code == 200:
        tasks = tts_resp.json().get("data", [])
        for task in tasks:
            requests.delete(f"{BASE_API_URL}/tts/{task['id']}", headers=headers, timeout=10)

    files_resp = requests.get(f"{BASE_API_URL}/upload/audio", headers=headers, timeout=10)
    if files_resp.status_code == 200:
        files = files_resp.json()
        for item in files:
            requests.delete(
                f"{BASE_API_URL}/upload/audio/{item['id']}",
                headers=headers,
                timeout=10,
            )

    voices_resp = requests.get(
        f"{BASE_API_URL}/voices?page=1&pageSize=100",
        headers=headers,
        timeout=10,
    )
    if voices_resp.status_code == 200:
        voices = voices_resp.json().get("data", [])
        for voice in voices:
            requests.delete(
                f"{BASE_API_URL}/voices/{voice['id']}",
                headers=headers,
                timeout=10,
            )


def delete_user_records(user_id: int):
    tables = [
        "credit_transactions",
        "tts_tasks",
        "voices",
        "uploaded_files",
        "recharge_orders",
    ]
    for table in tables:
        run_psql(f"DELETE FROM {table} WHERE user_id = {user_id};")

    run_psql(f"DELETE FROM users WHERE id = {user_id};")


def count_records(table: str, user_id: int) -> int:
    output = run_psql(f"SELECT COUNT(*) FROM {table} WHERE user_id = {user_id};")
    if not output:
        return 0
    return int(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("email")
    parser.add_argument("password", nargs="?")
    parser.add_argument("--allow-missing", action="store_true")
    parser.add_argument("--skip-api", action="store_true")
    parser.add_argument("--cleanup-only", action="store_true")
    args = parser.parse_args()

    user_id = get_user_id(args.email)
    if not user_id:
        if args.allow_missing:
            print("User not found, skipping deletion.")
            return 0
        print("User not found.")
        return 1

    if args.cleanup_only:
        if not args.password:
            print("Password required for cleanup-only.")
            return 1
        token = login(args.email, args.password)
        if not token:
            print("Login failed; cannot run API cleanup.")
            return 1
        cleanup_via_api(token)
        print("User files cleaned up successfully.")
        return 0

    if args.password and not args.skip_api:
        token = login(args.email, args.password)
        if not token:
            print("Login failed; cannot run API cleanup.")
            return 1
        cleanup_via_api(token)

    delete_user_records(user_id)

    remaining_user = get_user_id(args.email)
    if remaining_user:
        print("User record still exists after deletion.")
        return 1

    remaining_tables = [
        "tts_tasks",
        "voices",
        "uploaded_files",
        "credit_transactions",
        "recharge_orders",
    ]
    for table in remaining_tables:
        if count_records(table, user_id) != 0:
            print(f"Records still exist in table: {table}")
            return 1

    print("User and related records deleted successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
