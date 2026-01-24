"""API client wrapper for backend API calls."""

import requests
import time
from typing import Dict, Any, Optional, Callable


class APIClient:
    """Wrapper for all backend API calls with token management."""

    def __init__(self, base_url: str = "http://localhost:8080/api/v1"):
        self.base_url = base_url
        self.token = None
        self.timeout = 30

    def set_token(self, token: str):
        """Set JWT token for authenticated requests."""
        self.token = token

    def _get_headers(self, authenticated: bool = True) -> Dict[str, str]:
        """Get request headers with optional authentication."""
        headers = {"Content-Type": "application/json"}
        if authenticated and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _request(self, method: str, endpoint: str, authenticated: bool = True, **kwargs) -> requests.Response:
        """Make HTTP request with error handling."""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers(authenticated)
        response = requests.request(method, url, headers=headers, timeout=self.timeout, **kwargs)
        return response

    # Authentication methods
    def register(self, email: str, password: str, phone: Optional[str] = None,
                 nickname: Optional[str] = None, sms_code: Optional[str] = None) -> Dict[str, Any]:
        """Register new user."""
        data = {"email": email, "password": password}
        if phone:
            data["phone"] = phone
        if nickname:
            data["nickname"] = nickname
        if sms_code:
            data["sms_code"] = sms_code

        response = self._request("POST", "/auth/register", authenticated=False, json=data)
        return response.json()

    def login(self, login_id: str, password: str) -> Dict[str, Any]:
        """Login with email or phone."""
        data = {"login_id": login_id, "password": password}
        response = self._request("POST", "/auth/login", authenticated=False, json=data)
        return response.json()

    # Profile methods
    def get_profile(self) -> Dict[str, Any]:
        """Get user profile."""
        response = self._request("GET", "/profile")
        return response.json()

    # Upload methods
    def upload_audio(self, file_path: str) -> Dict[str, Any]:
        """Upload audio file."""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            response = requests.post(
                f"{self.base_url}/upload/audio",
                files=files,
                headers=headers,
                timeout=self.timeout
            )
        return response.json()

    # Voice management methods
    def create_voice(self, name: str, audio_url: str, with_transcript: bool = False) -> Dict[str, Any]:
        """Create voice cloning task."""
        data = {"name": name, "audio_url": audio_url, "with_transcript": with_transcript}
        response = self._request("POST", "/voices", json=data)
        return response.json()

    def get_voices(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get user's voice list."""
        response = self._request("GET", f"/voices?page={page}&page_size={page_size}")
        return response.json()

    def get_voice(self, voice_id: int) -> Dict[str, Any]:
        """Get voice details."""
        response = self._request("GET", f"/voices/{voice_id}")
        return response.json()

    def get_voice_status(self, voice_id: int) -> Dict[str, Any]:
        """Get voice cloning status."""
        response = self._request("GET", f"/voices/{voice_id}/status")
        return response.json()

    def delete_voice(self, voice_id: int) -> Dict[str, Any]:
        """Delete voice."""
        response = self._request("DELETE", f"/voices/{voice_id}")
        return response.json()

    # TTS methods
    def create_tts(self, voice_id: int, text: str, speed: float = 1.0) -> Dict[str, Any]:
        """Create TTS generation task."""
        data = {"voice_id": voice_id, "text": text, "speed": speed}
        response = self._request("POST", "/tts", json=data)
        return response.json()

    def get_tts_tasks(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get TTS task list."""
        response = self._request("GET", f"/tts?page={page}&page_size={page_size}")
        return response.json()

    def get_tts_task(self, task_id: int) -> Dict[str, Any]:
        """Get TTS task details."""
        response = self._request("GET", f"/tts/{task_id}")
        return response.json()

    def get_tts_status(self, task_id: int) -> Dict[str, Any]:
        """Get TTS task status."""
        response = self._request("GET", f"/tts/{task_id}/status")
        return response.json()

    def delete_tts_task(self, task_id: int) -> Dict[str, Any]:
        """Delete TTS task."""
        response = self._request("DELETE", f"/tts/{task_id}")
        return response.json()

    # Credit methods
    def get_credits_balance(self) -> int:
        """Get current credit balance."""
        response = self._request("GET", "/credits/balance")
        data = response.json()
        return data.get('balance', 0)

    def get_credit_transactions(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get credit transaction history."""
        response = self._request("GET", f"/credits/transactions?page={page}&page_size={page_size}")
        return response.json()

    # Helper methods
    def poll_until_complete(self, check_func: Callable[[], Dict[str, Any]],
                           max_attempts: int = 30, interval: int = 2) -> Dict[str, Any]:
        """Poll a status endpoint until completion or failure."""
        for attempt in range(max_attempts):
            result = check_func()
            status = result.get('status', '')

            if status in ['completed', 'trained']:
                return result
            elif status in ['failed', 'error']:
                raise Exception(f"Task failed: {result.get('error_msg', 'Unknown error')}")

            time.sleep(interval)

        raise TimeoutError(f"Polling timed out after {max_attempts} attempts")
