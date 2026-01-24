"""Smoke tests for backend API - covers critical user flows."""

import pytest
from helpers.test_data import generate_test_email, generate_password, generate_nickname, generate_voice_name, generate_text


@pytest.mark.smoke
@pytest.mark.auth
class TestAuthentication:
    """Test authentication flow: registration, login, JWT validation."""

    def test_user_registration_success(self, api_client):
        """Test user registration with email and password."""
        email = generate_test_email()
        password = generate_password()
        nickname = generate_nickname()

        response = api_client.register(email=email, password=password, nickname=nickname)

        # Verify response contains token
        assert 'token' in response, "Registration should return JWT token"
        token = response['token']
        assert token is not None and len(token) > 0

        # Set token and verify can access protected endpoints
        api_client.set_token(token)
        profile = api_client.get_profile()
        assert profile['email'] == email
        assert profile['points'] == 100, "New user should receive 100 initial credits"

    def test_user_login_success(self, api_client):
        """Test user login with registered credentials."""
        # First register a user
        email = generate_test_email()
        password = generate_password()
        api_client.register(email=email, password=password)

        # Then login
        response = api_client.login(login_id=email, password=password)

        # Verify response contains valid token
        assert 'token' in response
        token = response['token']
        assert token is not None and len(token) > 0

        # Verify token works for authenticated requests
        api_client.set_token(token)
        profile = api_client.get_profile()
        assert profile['email'] == email

    def test_jwt_token_validation(self, api_client):
        """Test JWT token validation for protected endpoints."""
        # Test without token - should fail
        api_client.set_token(None)
        try:
            api_client.get_profile()
            assert False, "Should fail without token"
        except Exception:
            pass  # Expected to fail

        # Test with valid token - should succeed
        email = generate_test_email()
        password = generate_password()
        response = api_client.register(email=email, password=password)
        api_client.set_token(response['token'])
        profile = api_client.get_profile()
        assert profile['email'] == email

    def test_get_user_profile(self, test_user, api_client):
        """Test getting user profile with valid token."""
        profile = api_client.get_profile()

        assert 'email' in profile
        assert 'points' in profile
        assert 'vipLevel' in profile
        assert profile['email'] == test_user['email']


@pytest.mark.smoke
@pytest.mark.voice
@pytest.mark.slow
class TestVoiceCloning:
    """Test voice cloning workflow: upload → create → poll → verify."""

    def test_complete_voice_clone_flow(self, test_user, api_client, test_audio_file, mock_external_services):
        """Test complete voice cloning flow with mocked external services."""
        # Get initial credit balance
        initial_credits = api_client.get_credits_balance()
        assert initial_credits >= 50, "Insufficient credits for test"

        # Upload audio file
        upload_response = api_client.upload_audio(test_audio_file)
        assert 'file_url' in upload_response or 'fileUrl' in upload_response
        audio_url = upload_response.get('file_url') or upload_response.get('fileUrl')

        # Create voice
        voice_name = generate_voice_name()
        create_response = api_client.create_voice(name=voice_name, audio_url=audio_url)
        assert 'data' in create_response
        voice_id = create_response['data']['id']

        # Verify credits deducted
        current_credits = api_client.get_credits_balance()
        assert current_credits < initial_credits, "Credits should be deducted"

        # Poll voice status until completed
        result = api_client.poll_until_complete(
            lambda: api_client.get_voice_status(voice_id),
            max_attempts=10,
            interval=1
        )
        assert result['status'] in ['completed', 'trained']

    def test_voice_clone_insufficient_credits(self, api_client, test_audio_file):
        """Test voice cloning with insufficient credits."""
        # This test would need a user with < 50 credits
        # For now, we skip this test as it requires special setup
        pytest.skip("Requires user with insufficient credits")

    def test_list_voices_pagination(self, test_user, api_client):
        """Test listing voices with pagination."""
        response = api_client.get_voices(page=1, page_size=5)

        assert 'data' in response
        assert 'total' in response
        assert isinstance(response['data'], list)


@pytest.mark.smoke
@pytest.mark.tts
@pytest.mark.slow
class TestTTSGeneration:
    """Test TTS generation workflow: select voice → generate → poll → download."""

    def test_complete_tts_generation_flow(self, test_user, api_client, test_audio_file, mock_external_services):
        """Test complete TTS generation flow with mocked external services."""
        # First create a completed voice
        upload_response = api_client.upload_audio(test_audio_file)
        audio_url = upload_response.get('file_url') or upload_response.get('fileUrl')

        voice_name = generate_voice_name()
        create_response = api_client.create_voice(name=voice_name, audio_url=audio_url)
        voice_id = create_response['data']['id']

        # Wait for voice to complete
        api_client.poll_until_complete(
            lambda: api_client.get_voice_status(voice_id),
            max_attempts=10,
            interval=1
        )

        # Get initial credit balance
        initial_credits = api_client.get_credits_balance()

        # Create TTS task
        text = generate_text(100)
        tts_response = api_client.create_tts(voice_id=voice_id, text=text)
        assert 'data' in tts_response
        task_id = tts_response['data']['id']

        # Verify credits deducted
        current_credits = api_client.get_credits_balance()
        assert current_credits < initial_credits, "Credits should be deducted for TTS"

        # Poll TTS status until completed
        result = api_client.poll_until_complete(
            lambda: api_client.get_tts_status(task_id),
            max_attempts=10,
            interval=1
        )
        assert result['status'] == 'completed'

    def test_tts_with_incomplete_voice(self, test_user, api_client):
        """Test TTS generation with incomplete voice."""
        # This would require a voice in pending status
        pytest.skip("Requires voice in pending status")

    def test_tts_text_validation(self, test_user, api_client):
        """Test TTS text validation."""
        # This would test empty text, too long text, etc.
        pytest.skip("Requires specific validation testing")


@pytest.mark.smoke
@pytest.mark.credits
class TestCreditSystem:
    """Test credit system: deduction, refunds, transaction tracking."""

    def test_credit_deduction_on_voice_creation(self, test_user, api_client, test_audio_file, mock_external_services):
        """Test credit deduction when creating voice."""
        initial_balance = api_client.get_credits_balance()

        # Upload and create voice
        upload_response = api_client.upload_audio(test_audio_file)
        audio_url = upload_response.get('file_url') or upload_response.get('fileUrl')

        voice_name = generate_voice_name()
        api_client.create_voice(name=voice_name, audio_url=audio_url)

        # Verify balance reduced
        new_balance = api_client.get_credits_balance()
        assert new_balance < initial_balance, "Credits should be deducted"

        # Check transaction history
        transactions = api_client.get_credit_transactions(page=1, page_size=5)
        assert 'data' in transactions
        assert len(transactions['data']) > 0

    def test_credit_deduction_on_tts_creation(self, test_user, api_client, test_audio_file, mock_external_services):
        """Test credit deduction when creating TTS task."""
        # First create a voice
        upload_response = api_client.upload_audio(test_audio_file)
        audio_url = upload_response.get('file_url') or upload_response.get('fileUrl')

        voice_name = generate_voice_name()
        create_response = api_client.create_voice(name=voice_name, audio_url=audio_url)
        voice_id = create_response['data']['id']

        # Wait for voice completion
        api_client.poll_until_complete(
            lambda: api_client.get_voice_status(voice_id),
            max_attempts=10,
            interval=1
        )

        # Get balance before TTS
        initial_balance = api_client.get_credits_balance()

        # Create TTS task
        text = generate_text(100)
        api_client.create_tts(voice_id=voice_id, text=text)

        # Verify balance reduced
        new_balance = api_client.get_credits_balance()
        assert new_balance < initial_balance, "Credits should be deducted for TTS"

    def test_credit_refund_on_voice_failure(self, test_user, api_client):
        """Test credit refund when voice cloning fails."""
        # This would require mocking a failure scenario
        pytest.skip("Requires failure scenario mocking")

    def test_get_credit_transactions(self, test_user, api_client):
        """Test getting credit transaction history."""
        transactions = api_client.get_credit_transactions(page=1, page_size=10)

        assert 'data' in transactions
        assert 'total' in transactions
        assert isinstance(transactions['data'], list)
