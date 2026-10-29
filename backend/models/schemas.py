"""
Pydantic Schemas for OpenLabs Speech Synthesis Engine & API
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import time
import uuid

class VoiceSettings(BaseModel):
    stability: float = Field(0.5, ge=0.0, le=1.0, description="Stability: lower = more expressive, higher = more consistent/calm")
    similarity_boost: float = Field(0.75, ge=0.0, le=1.0, description="Similarity / Clarity: weight of reference speaker voice")
    style: float = Field(0.0, ge=0.0, le=1.0, description="Style Exaggeration: emotional intensity and prosody boost")
    use_speaker_boost: bool = Field(True, description="Speaker Boost: enhances voice presence and acoustic similarity")

class Voice(BaseModel):
    voice_id: str
    name: str
    category: str = "premade"  # 'premade', 'cloned', 'generated'
    description: Optional[str] = None
    preview_url: Optional[str] = None
    labels: Dict[str, str] = Field(default_factory=dict)
    settings: Optional[VoiceSettings] = None
    samples: Optional[List[Any]] = None
    high_quality_base_model_ids: List[str] = Field(
        default_factory=lambda: ["openlabs_multilingual_v2", "openlabs_turbo_v2", "openlabs_flash_v2_5"]
    )

class VoicesResponse(BaseModel):
    voices: List[Voice]

class Language(BaseModel):
    language_id: str
    name: str

class Model(BaseModel):
    model_id: str
    name: str
    can_be_finetuned: bool = False
    can_do_text_to_speech: bool = True
    can_do_voice_conversion: bool = True
    can_use_style: bool = True
    can_use_speaker_boost: bool = True
    serves_pro_voices: bool = True
    token_cost_factor: float = 1.0
    description: str
    requires_alpha_access: bool = False
    maximum_text_length_per_request: int = 5000
    languages: List[Language]

class ModelsResponse(BaseModel):
    models: List[Model]

class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="The text to synthesize")
    model_id: Optional[str] = Field("openlabs_multilingual_v2", description="The ID of the model to use")
    voice_settings: Optional[VoiceSettings] = None
    pronunciation_dictionary_locators: Optional[List[Dict[str, Any]]] = None
    seed: Optional[int] = None
    previous_text: Optional[str] = None
    next_text: Optional[str] = None

class Alignment(BaseModel):
    characters: List[str]
    character_start_times_seconds: List[float]
    character_end_times_seconds: List[float]

class TextToSpeechWithTimestampsResponse(BaseModel):
    audio_base64: str
    alignment: Alignment
    normalized_alignment: Optional[Alignment] = None

class HistoryItem(BaseModel):
    history_item_id: str = Field(default_factory=lambda: f"hist_{uuid.uuid4().hex[:12]}")
    request_id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:12]}")
    voice_id: str
    model_id: str
    voice_name: str
    voice_category: str = "premade"
    text: str
    date_unix: int = Field(default_factory=lambda: int(time.time()))
    character_count_change_from: int = 100000
    character_count_change_to: int = 99950
    content_type: str = "audio/mpeg"
    state: str = "created"
    settings: Optional[VoiceSettings] = None
    duration_seconds: Optional[float] = 0.0

class HistoryResponse(BaseModel):
    history: List[HistoryItem]
    has_more: bool = False
    last_history_item_id: Optional[str] = None

class VoiceCloneResponse(BaseModel):
    voice_id: str
    requires_verification: bool = False

