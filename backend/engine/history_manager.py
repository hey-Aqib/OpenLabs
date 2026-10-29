"""
History Manager
Persists generated speech audio files and metadata matching GET /v1/history schema.
"""
import json
import uuid
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from backend.models.schemas import HistoryItem, VoiceSettings

HISTORY_DIR = Path(__file__).resolve().parent.parent / "data" / "history"
HISTORY_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = HISTORY_DIR / "history_index.json"

def _load_index() -> List[Dict]:
    if not INDEX_FILE.exists():
        return []
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_index(items: List[Dict]):
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)

def save_history_record(
    voice_id: str,
    voice_name: str,
    voice_category: str,
    model_id: str,
    text: str,
    audio_bytes: bytes,
    duration_seconds: float,
    settings: Optional[VoiceSettings] = None,
    content_type: str = "audio/mpeg"
) -> HistoryItem:
    """
    Saves audio file and registers metadata entry.
    """
    hist_id = f"hist_{uuid.uuid4().hex[:16]}"
    file_ext = "mp3" if "mpeg" in content_type else "wav"
    audio_filename = f"{hist_id}.{file_ext}"
    audio_path = HISTORY_DIR / audio_filename
    
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)
        
    item = HistoryItem(
        history_item_id=hist_id,
        request_id=f"req_{uuid.uuid4().hex[:12]}",
        voice_id=voice_id,
        model_id=model_id,
        voice_name=voice_name,
        voice_category=voice_category,
        text=text,
        date_unix=int(time.time()),
        character_count_change_from=100000,
        character_count_change_to=100000 - len(text),
        content_type=content_type,
        state="created",
        settings=settings,
        duration_seconds=duration_seconds
    )
    
    index = _load_index()
    index.insert(0, item.model_dump())
    _save_index(index)
    return item

def get_history_items(page_size: int = 100, voice_id: Optional[str] = None) -> List[HistoryItem]:
    index = _load_index()
    results = []
    for d in index:
        if voice_id and d.get("voice_id") != voice_id:
            continue
        try:
            results.append(HistoryItem(**d))
        except Exception:
            pass
        if len(results) >= page_size:
            break
    return results

def get_history_audio_path(history_item_id: str) -> Optional[Path]:
    for ext in ["mp3", "wav", "pcm"]:
        p = HISTORY_DIR / f"{history_item_id}.{ext}"
        if p.exists():
            return p
    return None

def delete_history_record(history_item_id: str) -> bool:
    index = _load_index()
    new_index = [item for item in index if item.get("history_item_id") != history_item_id]
    _save_index(new_index)
    
    p = get_history_audio_path(history_item_id)
    if p and p.exists():
        p.unlink()
        return True
    return len(new_index) < len(index)

