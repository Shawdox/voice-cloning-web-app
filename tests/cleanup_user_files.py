#!/usr/bin/env python3
"""
Helper script to delete all files associated with a user (OSS and backend).
This script is used by E2E tests to clean up after testing.
"""

import subprocess
import sys
import os

def cleanup_user_files(email):
    """
    Delete all files associated with a user from backend and OSS.

    Args:
        email (str): User email

    Returns:
        bool: True if successful, False otherwise
    """
    # This would involve:
    # 1. Deleting from backend database (uploaded audio files, TTS tasks)
    # 2. Deleting from OSS (actual audio files)

    # For now, we'll create a placeholder that can be expanded later
    print(f"🧹 Cleaning up files for user: {email}")

    # Example: Could call a Go script similar to update_credits.go
    # For now, just return True as the cleanup is done via account deletion in the UI
    return True

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 cleanup_user_files.py <email>")
        sys.exit(1)

    email = sys.argv[1]

    success = cleanup_user_files(email)
    sys.exit(0 if success else 1)
