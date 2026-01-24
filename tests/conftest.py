"""Pytest configuration and fixtures for backend API tests."""

import pytest
import responses
import os
from helpers.api_client import APIClient
from helpers.test_data import generate_test_email, generate_password, generate_nickname
from helpers.mock_services import setup_all_mocks


@pytest.fixture(scope="session")
def api_base_url():
    """Backend API base URL."""
    return os.getenv("API_BASE_URL", "http://localhost:8080/api/v1")


@pytest.fixture(scope="session")
def api_client(api_base_url):
    """Shared API client instance."""
    return APIClient(base_url=api_base_url)


@pytest.fixture(scope="session")
def test_audio_file():
    """Path to test audio file."""
    return os.path.join(os.path.dirname(__file__), "fixtures", "audio_samples", "test_audio.mp3")


@pytest.fixture
def test_user(api_client):
    """Create authenticated test user, yield token, cleanup after test."""
    # Create unique test user
    email = generate_test_email()
    password = generate_password()
    nickname = generate_nickname()

    # Register user
    response = api_client.register(email=email, password=password, nickname=nickname)
    token = response.get('token')

    # Set token in client
    api_client.set_token(token)

    # Yield user data and token
    user_data = {
        'email': email,
        'password': password,
        'nickname': nickname,
        'token': token
    }
    yield user_data

    # Cleanup: In a real scenario, you might want to delete the user
    # For now, we rely on database cleanup or test isolation
    pass


@pytest.fixture
def mock_external_services():
    """Setup mocks for external services (Fish Audio, OSS, SMS)."""
    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        rsps.add_passthru("http://localhost")
        rsps.add_passthru("http://127.0.0.1")
        setup_all_mocks(rsps)
        yield rsps
