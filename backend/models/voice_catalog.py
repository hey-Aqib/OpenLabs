"""
Voice Catalog & Voice Lab Manager
Contains canonical premade voice profiles and dynamic persistence for cloned/custom voices.
"""
import os
import json
from pathlib import Path
from typing import List, Dict, Optional
from backend.models.schemas import Voice, VoiceSettings

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "voices"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Curated High-Fidelity Voice Profiles with mapped acoustic characteristics
PREMADE_VOICES: List[Dict] = [
    {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "category": "premade",
        "description": "Calm, warm, and natural conversational American female. Flagship voice for narration and podcasts.",
        "labels": {
            "gender": "female",
            "age": "young",
            "accent": "american",
            "use_case": "narration",
            "tone": "calm"
        },
        "settings": {"stability": 0.50, "similarity_boost": 0.75, "style": 0.05, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "female",
            "pitch_shift_semitones": 2.5,
            "speaking_rate": 1.0,
            "formant_shift": 1.05,
            "presence_frequency": 3500.0,
            "warmth_boost_db": 1.5
        }
    },
    {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "name": "Adam",
        "category": "premade",
        "description": "Deep, authoritative, and smooth American male voice. Excellent for documentaries, audiobooks, and deep narration.",
        "labels": {
            "gender": "male",
            "age": "middle-aged",
            "accent": "american",
            "use_case": "narration",
            "tone": "deep"
        },
        "settings": {"stability": 0.60, "similarity_boost": 0.85, "style": 0.0, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -5.0,
            "speaking_rate": 0.95,
            "formant_shift": 0.88,
            "presence_frequency": 2800.0,
            "warmth_boost_db": 3.0
        }
    },
    {
        "voice_id": "ErXwobaYiN019PkySvjV",
        "name": "Antoni",
        "category": "premade",
        "description": "Crisp, dynamic, well-rounded young American male. Great for corporate storytelling, tutorials, and commercials.",
        "labels": {
            "gender": "male",
            "age": "young",
            "accent": "american",
            "use_case": "narration",
            "tone": "crisp"
        },
        "settings": {"stability": 0.50, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -1.5,
            "speaking_rate": 1.05,
            "formant_shift": 0.96,
            "presence_frequency": 3200.0,
            "warmth_boost_db": 1.0
        }
    },
    {
        "voice_id": "TxGEqnHWrfWFTfGW9XjX",
        "name": "Josh",
        "category": "premade",
        "description": "Energetic, dynamic, deep American male voice. Ideal for gaming characters, trailers, and promo videos.",
        "labels": {
            "gender": "male",
            "age": "young",
            "accent": "american",
            "use_case": "gaming",
            "tone": "dynamic"
        },
        "settings": {"stability": 0.40, "similarity_boost": 0.80, "style": 0.15, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -3.5,
            "speaking_rate": 1.08,
            "formant_shift": 0.92,
            "presence_frequency": 3000.0,
            "warmth_boost_db": 2.2
        }
    },
    {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Bella",
        "category": "premade",
        "description": "Soft, pleasant, melodic young female voice. Perfect for children stories, relaxation, and guided meditation.",
        "labels": {
            "gender": "female",
            "age": "young",
            "accent": "american",
            "use_case": "narration",
            "tone": "soft"
        },
        "settings": {"stability": 0.55, "similarity_boost": 0.70, "style": 0.10, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "female",
            "pitch_shift_semitones": 3.8,
            "speaking_rate": 0.98,
            "formant_shift": 1.12,
            "presence_frequency": 4000.0,
            "warmth_boost_db": 1.0
        }
    },
    {
        "voice_id": "VR6AewLTigWG4aiVqw7A",
        "name": "Arnold",
        "category": "premade",
        "description": "Confident, articulate, resonant middle-aged male voice. Great for news broadcasts and formal presentations.",
        "labels": {
            "gender": "male",
            "age": "middle-aged",
            "accent": "american",
            "use_case": "news",
            "tone": "confident"
        },
        "settings": {"stability": 0.70, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -2.5,
            "speaking_rate": 1.0,
            "formant_shift": 0.94,
            "presence_frequency": 3400.0,
            "warmth_boost_db": 1.8
        }
    },
    {
        "voice_id": "yoZ06aMxZJJ28mfd3POQ",
        "name": "Sam",
        "category": "premade",
        "description": "Raspy, narrative, textured young male voice. Suited for dramatic audiobooks and investigative storytelling.",
        "labels": {
            "gender": "male",
            "age": "young",
            "accent": "american",
            "use_case": "narration",
            "tone": "raspy"
        },
        "settings": {"stability": 0.45, "similarity_boost": 0.80, "style": 0.10, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -3.0,
            "speaking_rate": 0.97,
            "formant_shift": 0.90,
            "presence_frequency": 2900.0,
            "warmth_boost_db": 2.5
        }
    },
    {
        "voice_id": "JBFqnCBsd6RMkjVDRZzb",
        "name": "George",
        "category": "premade",
        "description": "Warm, captivating, British middle-aged male voice with classic refined resonance. Ideal for documentaries.",
        "labels": {
            "gender": "male",
            "age": "middle-aged",
            "accent": "british",
            "use_case": "narration",
            "tone": "warm"
        },
        "settings": {"stability": 0.65, "similarity_boost": 0.80, "style": 0.05, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "male",
            "pitch_shift_semitones": -2.0,
            "speaking_rate": 0.95,
            "formant_shift": 0.92,
            "presence_frequency": 3100.0,
            "warmth_boost_db": 2.8
        }
    },
    {
        "voice_id": "piTKgcLEGmPE4e6mEKli",
        "name": "Nicole",
        "category": "premade",
        "description": "Whispery, intimate, velvety Australian female voice. Ideal for commercial advertising and ASMR style narration.",
        "labels": {
            "gender": "female",
            "age": "young",
            "accent": "australian",
            "use_case": "conversational",
            "tone": "whispery"
        },
        "settings": {"stability": 0.40, "similarity_boost": 0.70, "style": 0.20, "use_speaker_boost": True},
        "acoustic_params": {
            "gender": "female",
            "pitch_shift_semitones": 2.0,
            "speaking_rate": 1.02,
            "formant_shift": 1.06,
            "presence_frequency": 3800.0,
            "warmth_boost_db": 1.2
        }
    }
]

def load_custom_voices() -> List[Dict]:
    custom_voices = []
    if not DATA_DIR.exists():
        return custom_voices
    for voice_file in DATA_DIR.glob("*.json"):
        try:
            with open(voice_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                custom_voices.append(data)
        except Exception as e:
            print(f"Error loading custom voice {voice_file}: {e}")
    return custom_voices

def get_all_voices_dict() -> List[Dict]:
    premade = [v.copy() for v in PREMADE_VOICES]
    custom = load_custom_voices()
    return premade + custom

def get_all_voices() -> List[Voice]:
    all_dicts = get_all_voices_dict()
    voices = []
    for d in all_dicts:
        settings = VoiceSettings(**d["settings"]) if "settings" in d and d["settings"] else None
        v = Voice(
            voice_id=d["voice_id"],
            name=d["name"],
            category=d.get("category", "premade"),
            description=d.get("description"),
            preview_url=d.get("preview_url", f"/v1/voices/{d['voice_id']}/preview"),
            labels=d.get("labels", {}),
            settings=settings
        )
        voices.append(v)
    return voices

def get_voice_by_id(voice_id: str) -> Optional[Dict]:
    for v in PREMADE_VOICES:
        if v["voice_id"] == voice_id:
            return v.copy()
    custom_path = DATA_DIR / f"{voice_id}.json"
    if custom_path.exists():
        try:
            with open(custom_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading custom voice {custom_path}: {e}")
    # Fallback to default Rachel voice if not found
    return PREMADE_VOICES[0].copy()

def save_custom_voice(voice_data: Dict) -> Dict:
    voice_id = voice_data["voice_id"]
    dest = DATA_DIR / f"{voice_id}.json"
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(voice_data, f, indent=2)
    return voice_data

def delete_custom_voice(voice_id: str) -> bool:
    dest = DATA_DIR / f"{voice_id}.json"
    if dest.exists():
        dest.unlink()
        return True
    return False

