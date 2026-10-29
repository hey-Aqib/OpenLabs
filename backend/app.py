"""
FastAPI Server - OpenLabs Speech Synthesis Engine & Studio
Provides high-performance Speech Synthesis, Voice Lab,
Audio Streaming, History, and WebSockets.
"""
import os
import json
import base64
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.models.schemas import (
    VoicesResponse, Voice, VoiceSettings,
    ModelsResponse, Model, Language,
    TextToSpeechRequest, TextToSpeechWithTimestampsResponse,
    HistoryResponse, HistoryItem, VoiceCloneResponse
)
from backend.models.voice_catalog import (
    get_all_voices, get_voice_by_id, delete_custom_voice
)
from backend.engine.synthesizer import synthesizer_instance
from backend.engine.voice_cloner import create_instant_voice_clone, create_designed_voice
from backend.engine.history_manager import (
    save_history_record, get_history_items, get_history_audio_path, delete_history_record
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="OpenLabs - Speech Engine & Studio",
    description="High-fidelity voice synthesis & cloning engine.",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicit static file route handlers
@app.get("/static/css/style.css")
async def serve_css():
    return FileResponse(str(FRONTEND_DIR / "css" / "style.css"), media_type="text/css")

@app.get("/static/js/app.js")
async def serve_js():
    return FileResponse(str(FRONTEND_DIR / "js" / "app.js"), media_type="application/javascript")

# Mount frontend static files fallback
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/", include_in_schema=False)
async def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# ==========================================
# 1. MODELS ENDPOINT (/v1/models)
# ==========================================
AVAILABLE_MODELS = [
    Model(
        model_id="openlabs_multilingual_v2",
        name="OpenLabs Multilingual v2",
        can_do_text_to_speech=True,
        can_do_voice_conversion=True,
        can_use_style=True,
        can_use_speaker_boost=True,
        token_cost_factor=1.0,
        description="Flagship multilingual model with rich emotional prosody and full voice settings support.",
        maximum_text_length_per_request=5000,
        languages=[
            Language(language_id="en", name="English"),
            Language(language_id="es", name="Spanish"),
            Language(language_id="fr", name="French"),
            Language(language_id="de", name="German"),
            Language(language_id="hi", name="Hindi"),
            Language(language_id="ja", name="Japanese")
        ]
    ),
    Model(
        model_id="openlabs_flash_v2_5",
        name="OpenLabs Flash v2.5",
        can_do_text_to_speech=True,
        can_do_voice_conversion=False,
        can_use_style=False,
        can_use_speaker_boost=True,
        token_cost_factor=0.5,
        description="Ultra-low latency model engineered for real-time conversational agents and low TTFA.",
        maximum_text_length_per_request=5000,
        languages=[Language(language_id="en", name="English")]
    ),
    Model(
        model_id="openlabs_turbo_v2",
        name="OpenLabs Turbo v2",
        can_do_text_to_speech=True,
        can_do_voice_conversion=True,
        can_use_style=True,
        can_use_speaker_boost=True,
        token_cost_factor=0.8,
        description="Fast English-specialized neural voice generation with crisp articulation.",
        maximum_text_length_per_request=5000,
        languages=[Language(language_id="en", name="English")]
    ),
    Model(
        model_id="openlabs_neural_v1",
        name="OpenLabs Neural v1 (Offline SAPI5)",
        can_do_text_to_speech=True,
        can_do_voice_conversion=False,
        can_use_style=False,
        can_use_speaker_boost=True,
        token_cost_factor=0.3,
        description="Direct local acoustic synthesis engine with zero cloud dependency.",
        maximum_text_length_per_request=5000,
        languages=[Language(language_id="en", name="English")]
    )
]

@app.get("/v1/models", response_model=List[Model], tags=["Models"])
async def get_models():
    """Retrieves all available speech models."""
    return AVAILABLE_MODELS

# ==========================================
# 2. VOICES ENDPOINTS (/v1/voices)
# ==========================================
@app.get("/v1/voices", response_model=VoicesResponse, tags=["Voices"])
async def list_voices():
    """Retrieves all premade, cloned, and designed voices."""
    return VoicesResponse(voices=get_all_voices())

@app.get("/v1/voices/{voice_id}", response_model=Voice, tags=["Voices"])
async def get_single_voice(voice_id: str):
    """Retrieves metadata for a specific voice."""
    v_dict = get_voice_by_id(voice_id)
    if not v_dict:
        raise HTTPException(status_code=404, detail="Voice not found")
    settings = VoiceSettings(**v_dict["settings"]) if "settings" in v_dict and v_dict["settings"] else None
    return Voice(
        voice_id=v_dict["voice_id"],
        name=v_dict["name"],
        category=v_dict.get("category", "premade"),
        description=v_dict.get("description"),
        preview_url=v_dict.get("preview_url", f"/v1/voices/{voice_id}/preview"),
        labels=v_dict.get("labels", {}),
        settings=settings
    )

@app.get("/v1/voices/{voice_id}/preview", tags=["Voices"])
async def get_voice_preview(voice_id: str):
    """Generates and streams a sample preview for the selected voice."""
    voice = get_voice_by_id(voice_id)
    name = voice.get("name", "Speaker")
    desc = voice.get("description", "This is a preview sample.")
    preview_script = f"Hello! I am {name}. {desc}"
    
    audio_bytes, dur, align, mime = synthesizer_instance.synthesize(
        text=preview_script,
        voice_id=voice_id,
        model_id="openlabs_multilingual_v2",
        output_format="mp3_44100_128"
    )
    return Response(content=audio_bytes, media_type=mime)

@app.post("/v1/voices/add", response_model=VoiceCloneResponse, tags=["Voice Lab"])
async def add_voice_clone(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    description: Optional[str] = Form(None),
    labels: Optional[str] = Form(None)
):
    """
    Instant Voice Cloning: Ingests reference audio files (or microphone recordings),
    extracts pitch and acoustic timbre characteristics, and registers the cloned voice.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one audio file must be uploaded")
        
    primary_file = files[0]
    audio_bytes = await primary_file.read()
    
    ext = primary_file.filename.split(".")[-1] if primary_file.filename and "." in primary_file.filename else "wav"
    
    parsed_labels = {}
    if labels:
        try:
            parsed_labels = json.loads(labels)
        except Exception:
            parsed_labels = {"accent": "custom"}
            
    voice_record = create_instant_voice_clone(
        name=name,
        audio_bytes=audio_bytes,
        file_ext=ext,
        description=description,
        labels=parsed_labels
    )
    
    return VoiceCloneResponse(voice_id=voice_record["voice_id"], requires_verification=False)

@app.post("/v1/voices/design", tags=["Voice Lab"])
async def design_synthetic_voice(payload: dict):
    """
    Voice Design: Synthesizes a new custom voice profile from parameters:
    name, gender, age, accent, accent_strength.
    """
    name = payload.get("name", "Custom Designed Voice")
    gender = payload.get("gender", "female")
    age = payload.get("age", "young")
    accent = payload.get("accent", "american")
    accent_strength = float(payload.get("accent_strength", 1.0))
    desc = payload.get("description", None)
    
    created = create_designed_voice(
        name=name,
        gender=gender,
        age=age,
        accent=accent,
        accent_strength=accent_strength,
        description=desc
    )
    return created

@app.delete("/v1/voices/{voice_id}", tags=["Voices"])
async def delete_voice(voice_id: str):
    """Deletes a custom cloned voice."""
    success = delete_custom_voice(voice_id)
    if not success:
        raise HTTPException(status_code=404, detail="Custom voice not found or cannot be deleted")
    return {"status": "ok", "message": f"Voice {voice_id} deleted successfully"}

# ==========================================
# 3. TEXT-TO-SPEECH ENDPOINTS (/v1/text-to-speech)
# ==========================================
@app.post("/v1/text-to-speech/{voice_id}", tags=["Text to Speech"])
async def text_to_speech(
    voice_id: str,
    payload: TextToSpeechRequest,
    output_format: str = Query("mp3_44100_128")
):
    """
    Non-streaming Text to Speech:
    Synthesizes complete text, applies voice settings DSP, records to history,
    and returns full audio binary buffer.
    """
    voice = get_voice_by_id(voice_id)
    
    audio_bytes, dur, align, mime = synthesizer_instance.synthesize(
        text=payload.text,
        voice_id=voice_id,
        model_id=payload.model_id or "openlabs_multilingual_v2",
        voice_settings=payload.voice_settings,
        output_format=output_format
    )
    
    # Save to generation history
    save_history_record(
        voice_id=voice_id,
        voice_name=voice.get("name", "Speaker"),
        voice_category=voice.get("category", "premade"),
        model_id=payload.model_id or "openlabs_multilingual_v2",
        text=payload.text,
        audio_bytes=audio_bytes,
        duration_seconds=dur,
        settings=payload.voice_settings,
        content_type=mime
    )
    
    return Response(
        content=audio_bytes,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="speech_{voice_id}.mp3"',
            "X-Duration-Seconds": str(dur)
        }
    )

@app.post("/v1/text-to-speech/{voice_id}/stream", tags=["Text to Speech"])
async def text_to_speech_stream(
    voice_id: str,
    payload: TextToSpeechRequest,
    output_format: str = Query("mp3_44100_128")
):
    """
    HTTP Chunked Streaming Text to Speech:
    Synthesizes sentence chunks asynchronously and streams audio frames with low TTFA.
    """
    mime = "audio/mpeg" if "mp3" in output_format else "audio/wav"
    
    chunk_generator = synthesizer_instance.stream_audio_chunks(
        text=payload.text,
        voice_id=voice_id,
        model_id=payload.model_id or "openlabs_turbo_v2",
        voice_settings=payload.voice_settings,
        output_format=output_format
    )
    
    return StreamingResponse(
        chunk_generator,
        media_type=mime,
        headers={
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/v1/text-to-speech/{voice_id}/with-timestamps", response_model=TextToSpeechWithTimestampsResponse, tags=["Text to Speech"])
async def text_to_speech_with_timestamps(
    voice_id: str,
    payload: TextToSpeechRequest,
    output_format: str = Query("mp3_44100_128")
):
    """
    Text to Speech with Timestamps:
    Returns Base64-encoded audio alongside character-level start and end timestamps.
    """
    audio_bytes, dur, align, mime = synthesizer_instance.synthesize(
        text=payload.text,
        voice_id=voice_id,
        model_id=payload.model_id or "openlabs_multilingual_v2",
        voice_settings=payload.voice_settings,
        output_format=output_format
    )
    
    b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
    
    return TextToSpeechWithTimestampsResponse(
        audio_base64=b64_audio,
        alignment=align,
        normalized_alignment=align
    )

# ==========================================
# 4. WEBSOCKET BIDIRECTIONAL STREAMING (/v1/text-to-speech/{voice_id}/stream-input)
# ==========================================
@app.websocket("/v1/text-to-speech/{voice_id}/stream-input")
async def websocket_stream_input(websocket: WebSocket, voice_id: str):
    """
    Bidirectional WebSocket streaming:
    Receives incoming text chunks / LLM tokens and yields Base64 audio chunks with alignment.
    """
    await websocket.accept()
    current_settings = None
    model_id = "openlabs_flash_v2_5"
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            # 1. Config / settings frame
            if "voice_settings" in msg and msg["voice_settings"]:
                current_settings = VoiceSettings(**msg["voice_settings"])
            if "model_id" in msg:
                model_id = msg["model_id"]
                
            text = msg.get("text", "")
            
            # 2. End-of-stream signal
            if text == "":
                await websocket.send_json({
                    "audio": "",
                    "isFinal": True,
                    "normalized_alignment": None
                })
                break
                
            # 3. Incremental text chunk synthesis
            if text.strip():
                audio_bytes, dur, align, mime = synthesizer_instance.synthesize(
                    text=text,
                    voice_id=voice_id,
                    model_id=model_id,
                    voice_settings=current_settings,
                    output_format="mp3_44100_128"
                )
                
                b64_chunk = base64.b64encode(audio_bytes).decode("utf-8")
                
                await websocket.send_json({
                    "audio": b64_chunk,
                    "isFinal": False,
                    "normalized_alignment": align.model_dump()
                })
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass

# ==========================================
# 5. GENERATION HISTORY ENDPOINTS (/v1/history)
# ==========================================
@app.get("/v1/history", response_model=HistoryResponse, tags=["History"])
async def get_history(
    page_size: int = Query(100, ge=1, le=1000),
    voice_id: Optional[str] = Query(None)
):
    """Retrieves chronological history of generated audio files and settings."""
    items = get_history_items(page_size=page_size, voice_id=voice_id)
    return HistoryResponse(
        history=items,
        has_more=False,
        last_history_item_id=items[-1].history_item_id if items else None
    )

@app.get("/v1/history/{history_item_id}/audio", tags=["History"])
async def get_history_audio(history_item_id: str):
    """Downloads audio file from generation history."""
    audio_path = get_history_audio_path(history_item_id)
    if not audio_path or not audio_path.exists():
        raise HTTPException(status_code=404, detail="History audio file not found")
        
    mime = "audio/mpeg" if audio_path.suffix == ".mp3" else "audio/wav"
    return FileResponse(
        str(audio_path),
        media_type=mime,
        filename=audio_path.name
    )

@app.delete("/v1/history/{history_item_id}", tags=["History"])
async def delete_history_item_route(history_item_id: str):
    """Deletes an item from generation history."""
    success = delete_history_record(history_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"status": "ok", "message": f"History item {history_item_id} deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)

