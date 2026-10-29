"""
End-to-End API Parity & Acoustic Verification Test Suite
Tests all OpenLabs endpoints against open-source implementation.
"""
import pytest
import io
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from backend.app import app

client = TestClient(app)

def test_get_models():
    """Verify GET /v1/models returns OpenLabs model metadata."""
    response = client.get("/v1/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 3
    model_ids = [m["model_id"] for m in models]
    assert "openlabs_multilingual_v2" in model_ids
    assert "openlabs_flash_v2_5" in model_ids
    assert "openlabs_turbo_v2" in model_ids

def test_get_voices():
    """Verify GET /v1/voices returns canonical premade voices."""
    response = client.get("/v1/voices")
    assert response.status_code == 200
    data = response.json()
    assert "voices" in data
    assert len(data["voices"]) >= 8
    
    names = [v["name"] for v in data["voices"]]
    assert "Rachel" in names
    assert "Adam" in names
    assert "Antoni" in names
    assert "Bella" in names

def test_text_to_speech_standard():
    """Verify non-streaming POST /v1/text-to-speech/{voice_id} generates MP3 audio."""
    payload = {
        "text": "Hello world, this is a test of the speech synthesis engine.",
        "model_id": "openlabs_multilingual_v2",
        "voice_settings": {
            "stability": 0.50,
            "similarity_boost": 0.75,
            "style": 0.05,
            "use_speaker_boost": True
        }
    }
    # Test Rachel voice (21m00Tcm4TlvDq8ikWAM)
    response = client.post("/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert len(response.content) > 1000

def test_text_to_speech_with_timestamps():
    """Verify POST /v1/text-to-speech/{voice_id}/with-timestamps returns base64 and alignment."""
    payload = {
        "text": "Speech with timestamps.",
        "model_id": "openlabs_turbo_v2"
    }
    response = client.post("/v1/text-to-speech/pNInz6obpgDQGcFmaJgB/with-timestamps", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "audio_base64" in data
    assert "alignment" in data
    assert len(data["audio_base64"]) > 500
    
    align = data["alignment"]
    assert len(align["characters"]) > 0
    assert len(align["character_start_times_seconds"]) == len(align["characters"])
    assert len(align["character_end_times_seconds"]) == len(align["characters"])
    assert align["character_start_times_seconds"][0] == 0.0

def test_text_to_speech_stream():
    """Verify chunked streaming POST /v1/text-to-speech/{voice_id}/stream."""
    payload = {
        "text": "First sentence streaming. Second sentence streaming.",
        "model_id": "openlabs_flash_v2_5"
    }
    response = client.post("/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream", json=payload)
    assert response.status_code == 200
    assert response.headers["transfer-encoding"] == "chunked"
    assert len(response.content) > 1000

def test_voice_cloning():
    """Verify Instant Voice Cloning POST /v1/voices/add with synthetic audio sample."""
    # Create test WAV sample in memory (1.5s 440Hz tone)
    sr = 22050
    t = np.linspace(0, 1.5, int(sr * 1.5))
    tone = (np.sin(2 * np.pi * 140 * t) * 0.7).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, tone, sr, format="WAV")
    buf.seek(0)
    
    response = client.post(
        "/v1/voices/add",
        data={"name": "Test Cloned Speaker", "description": "Unit test synthetic clone"},
        files={"files": ("test_sample.wav", buf, "audio/wav")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "voice_id" in data
    assert data["requires_verification"] is False

def test_history_workflow():
    """Verify GET /v1/history and GET /v1/history/{id}/audio."""
    response = client.get("/v1/history")
    assert response.status_code == 200
    history = response.json()["history"]
    assert len(history) > 0
    
    first_item = history[0]
    hist_id = first_item["history_item_id"]
    
    audio_resp = client.get(f"/v1/history/{hist_id}/audio")
    assert audio_resp.status_code == 200
    assert len(audio_resp.content) > 500

if __name__ == "__main__":
    pytest.main(["-v", __file__])

