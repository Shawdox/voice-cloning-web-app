#!/usr/bin/env python3
"""
Helper script to update user credits in the database.
This script is used by E2E tests to set up test scenarios.
"""

import subprocess
import sys
import os

def update_credits(email, credits):
    """
    Update user credits using psql command.

    Args:
        email (str): User email
        credits (int): Credits to set

    Returns:
        bool: True if successful, False otherwise
    """
    # Get database connection from environment
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'voice_clone_db')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', 'postgres')

    try:
        # Update credits using psql
        sql = f"UPDATE users SET credits = {credits} WHERE email = '{email}';"
        cmd = [
            'psql',
            f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}',
            '-c', sql
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            print(f"✅ Successfully updated credits for {email} to {credits}")
            return True
        else:
            print(f"❌ Failed to update credits: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Timeout while updating credits")
        return False
    except Exception as e:
        print(f"❌ Error updating credits: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 update_credits.py <email> <credits>")
        sys.exit(1)

    email = sys.argv[1]
    credits = int(sys.argv[2])

    success = update_credits(email, credits)
    sys.exit(0 if success else 1)
