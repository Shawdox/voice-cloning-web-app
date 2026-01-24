"""Mock setup for external services (Fish Audio, OSS, SMS)."""

import responses
import json
import re
from typing import Dict, Any


class MockFishAudio:
    """Mock Fish Audio API responses."""

    def __init__(self):
        self.voice_call_count = {}
        self.tts_call_count = {}

    def setup_voice_creation_mock(self, rsps: responses.RequestsMock):
        """Mock voice creation endpoint."""
        def voice_creation_callback(request):
            voice_id = f"mock_fish_voice_{hash(request.body) % 10000}"
            return (201, {}, json.dumps({
                "id": voice_id,
                "status": "training"
            }))

        rsps.add_callback(
            responses.POST,
            "https://api.fish.audio/model",
            callback=voice_creation_callback,
            content_type="application/json"
        )

    def setup_voice_status_mock(self, rsps: responses.RequestsMock):
        """Mock voice status polling - returns 'training' first, then 'trained'."""
        def voice_status_callback(request):
            voice_id = request.url.split('/')[-1]

            # Track call count for this voice
            if voice_id not in self.voice_call_count:
                self.voice_call_count[voice_id] = 0
            self.voice_call_count[voice_id] += 1

            # First call: training, second call: trained
            if self.voice_call_count[voice_id] == 1:
                return (200, {}, json.dumps({
                    "id": voice_id,
                    "status": "training",
                    "progress": 50
                }))
            else:
                return (200, {}, json.dumps({
                    "id": voice_id,
                    "status": "trained",
                    "fishVoiceId": voice_id
                }))

        rsps.add_callback(
            responses.GET,
            re.compile(r"https://api\.fish\.audio/model/.*"),
            callback=voice_status_callback,
            content_type="application/json"
        )

    def setup_tts_generation_mock(self, rsps: responses.RequestsMock):
        """Mock TTS generation endpoint."""
        def tts_generation_callback(request):
            task_id = f"mock_tts_task_{hash(request.body) % 10000}"
            return (200, {}, json.dumps({
                "task_id": task_id,
                "status": "processing"
            }))

        rsps.add_callback(
            responses.POST,
            "https://api.fish.audio/v1/tts",
            callback=tts_generation_callback,
            content_type="application/json"
        )

    def setup_tts_status_mock(self, rsps: responses.RequestsMock):
        """Mock TTS status polling - returns 'processing' first, then 'completed'."""
        def tts_status_callback(request):
            task_id = request.url.split('/')[-1]

            # Track call count for this task
            if task_id not in self.tts_call_count:
                self.tts_call_count[task_id] = 0
            self.tts_call_count[task_id] += 1

            # First call: processing, second call: completed
            if self.tts_call_count[task_id] == 1:
                return (200, {}, json.dumps({
                    "task_id": task_id,
                    "status": "processing",
                    "progress": 50
                }))
            else:
                return (200, {}, json.dumps({
                    "task_id": task_id,
                    "status": "completed",
                    "audio_url": "https://mock.cdn/audio.mp3",
                    "duration": 5.2
                }))

        rsps.add_callback(
            responses.GET,
            re.compile(r"https://api\.fish\.audio/v1/tts/tasks/.*"),
            callback=tts_status_callback,
            content_type="application/json"
        )


class MockOSS:
    """Mock Aliyun OSS operations."""

    @staticmethod
    def setup_upload_mock(rsps: responses.RequestsMock):
        """Mock OSS file upload - not actually called via HTTP in tests."""
        # OSS upload is mocked at the service layer, not HTTP level
        pass


class MockSMS:
    """Mock Aliyun SMS operations."""

    @staticmethod
    def setup_sms_mock(rsps: responses.RequestsMock):
        """Mock SMS sending - not actually called via HTTP in tests."""
        # SMS is mocked at the service layer, not HTTP level
        pass


def setup_all_mocks(rsps: responses.RequestsMock):
    """Setup all external service mocks."""
    fish_audio = MockFishAudio()
    fish_audio.setup_voice_creation_mock(rsps)
    fish_audio.setup_voice_status_mock(rsps)
    fish_audio.setup_tts_generation_mock(rsps)
    fish_audio.setup_tts_status_mock(rsps)

    MockOSS.setup_upload_mock(rsps)
    MockSMS.setup_sms_mock(rsps)

    return fish_audio
