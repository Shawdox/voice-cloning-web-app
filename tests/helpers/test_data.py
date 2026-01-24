"""Test data generators for creating realistic test data."""

import uuid
from faker import Faker

fake = Faker('zh_CN')  # Chinese locale for realistic names


def generate_test_email():
    """Generate unique test email address."""
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def generate_password():
    """Generate valid password (min 6 chars)."""
    return "Test123456"


def generate_nickname():
    """Generate random Chinese nickname."""
    return fake.name()


def generate_phone():
    """Generate Chinese mobile phone number."""
    return f"138{fake.random_number(digits=8, fix_len=True)}"


def generate_voice_name():
    """Generate unique voice name."""
    return f"测试音色_{uuid.uuid4().hex[:6]}"


def generate_text(length=100):
    """Generate Chinese text of specified length."""
    text = ""
    while len(text) < length:
        text += fake.sentence()
    return text[:length]


def generate_long_text():
    """Generate text near the 10000 character limit."""
    return generate_text(9500)
