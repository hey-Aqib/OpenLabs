"""
Voice Lab & Instant Voice Cloning (IVC) Engine
Extracts acoustic identity (F0 pitch contour, formant resonances, spectral centroid, warmth/presence)
from user audio clips to create instant zero-shot voice clones.
"""
import os
import uuid
import json
import numpy as np
import scipy.signal as signal
import soundfile as sf
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from api.models.voice_catalog import save_custom_voice

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "voices"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def estimate_pitch_f0(audio: np.ndarray, sr: int) -> float:
    """
    Estimates median fundamental frequency (F0) using autocorrelation.
    Constrained to human vocal range [75 Hz, 450 Hz].
    """
    if len(audio) < sr // 4:
        return 175.0  # Default neutral pitch
        
    # Analyze window around center of audio
    mid = len(audio) // 2
    window_len = min(sr * 2, len(audio))
    segment = audio[mid - window_len // 2 : mid + window_len // 2]
    
    # Downsample to 8kHz for fast autocorrelation
    target_sr = 8000
    downsampled = signal.resample(segment, int(len(segment) * target_sr / sr))
    
    # Normalized autocorrelation
    r = np.correlate(downsampled, downsampled, mode='full')
    r = r[len(r) // 2:]
    
    min_lag = int(target_sr / 450.0)  # Max 450 Hz
    max_lag = int(target_sr / 75.0)   # Min 75 Hz
    
    if max_lag >= len(r):
        return 175.0
        
    peak_lag = np.argmax(r[min_lag:max_lag]) + min_lag
    if peak_lag == 0:
        return 175.0
        
    f0 = float(target_sr / peak_lag)
    # Clamp to valid range
    f0 = np.clip(f0, 75.0, 450.0)
    return round(float(f0), 1)

def estimate_spectral_features(audio: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Computes spectral centroid (timbral brightness) and spectral roll-off.
    """
    # FFT magnitude
    n_fft = 2048
    if len(audio) < n_fft:
        return {"spectral_centroid": 3000.0, "formant_shift": 1.0}
        
    fft_mag = np.abs(np.fft.rfft(audio[:n_fft * 4]))
    freqs = np.fft.rfftfreq(len(audio[:n_fft * 4]), 1.0 / sr)
    
    sum_mag = np.sum(fft_mag)
    if sum_mag < 1e-6:
        centroid = 3000.0
    else:
        centroid = float(np.sum(freqs * fft_mag) / sum_mag)
        
    # Formant shift approximation relative to standard voice (approx 3200 Hz centroid)
    formant_shift = np.clip(centroid / 3200.0, 0.85, 1.25)
    
    return {
        "spectral_centroid": round(centroid, 1),
        "formant_shift": round(float(formant_shift), 2)
    }

def analyze_voice_sample(file_path: Path) -> Dict[str, Any]:
    """
    Processes uploaded WAV / MP3 / OGG audio file and extracts voice cloning acoustic parameters.
    """
    data, sr = sf.read(str(file_path))
    # Convert stereo to mono
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)
        
    # Normalize
    data = data.astype(np.float32)
    peak = np.max(np.abs(data))
    if peak > 0:
        data = data / peak
        
    f0 = estimate_pitch_f0(data, sr)
    spectral = estimate_spectral_features(data, sr)
    
    # Baseline reference pitch is ~175 Hz (middle gender neutral)
    # Pitch shift semitones: 12 * log2(F0 / baseline)
    baseline_f0 = 175.0
    pitch_shift_semitones = float(12.0 * np.log2(max(f0, 60.0) / baseline_f0))
    pitch_shift_semitones = np.clip(pitch_shift_semitones, -8.0, 8.0)
    
    # Inferred gender and vocal tone
    if f0 < 160.0:
        gender = "male"
        tone = "deep" if f0 < 120.0 else "warm"
        presence_freq = 2800.0 + (f0 - 80) * 5.0
        warmth_db = 2.5
    else:
        gender = "female"
        tone = "bright" if f0 > 230.0 else "conversational"
        presence_freq = 3600.0 + (f0 - 180) * 4.0
        warmth_db = 1.0
        
    presence_freq = np.clip(presence_freq, 2400.0, 4800.0)
    
    acoustic_params = {
        "gender": gender,
        "f0_hz": f0,
        "pitch_shift_semitones": round(pitch_shift_semitones, 2),
        "formant_shift": spectral["formant_shift"],
        "presence_frequency": round(float(presence_freq), 1),
        "warmth_boost_db": warmth_db,
        "speaking_rate": 1.0
    }
    
    return acoustic_params

def create_instant_voice_clone(
    name: str,
    audio_bytes: bytes,
    file_ext: str = "wav",
    description: Optional[str] = None,
    labels: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Instant Voice Cloning: saves audio sample, extracts acoustic features,
    and creates a ready-to-use cloned voice.
    """
    voice_id = f"clone_{uuid.uuid4().hex[:16]}"
    
    # Save audio sample
    sample_filename = f"{voice_id}.{file_ext}"
    sample_path = DATA_DIR / sample_filename
    with open(sample_path, "wb") as f:
        f.write(audio_bytes)
        
    try:
        acoustic_params = analyze_voice_sample(sample_path)
    except Exception as e:
        print(f"Error analyzing voice sample: {e}")
        acoustic_params = {
            "gender": "neutral",
            "f0_hz": 175.0,
            "pitch_shift_semitones": 0.0,
            "formant_shift": 1.0,
            "presence_frequency": 3300.0,
            "warmth_boost_db": 1.5,
            "speaking_rate": 1.0
        }
        
    final_labels = {
        "accent": "custom",
        "gender": acoustic_params["gender"],
        "age": "young" if acoustic_params.get("f0_hz", 175) > 200 else "middle-aged",
        "use_case": "cloned",
        "tone": f"{int(acoustic_params.get('f0_hz', 175))}Hz"
    }
    if labels:
        final_labels.update(labels)
        
    voice_record = {
        "voice_id": voice_id,
        "name": name,
        "category": "cloned",
        "description": description or f"Cloned voice extracted from reference sample ({acoustic_params['gender']}, {acoustic_params.get('f0_hz', 175)}Hz)",
        "preview_url": f"/v1/voices/{voice_id}/preview",
        "labels": final_labels,
        "settings": {
            "stability": 0.55,
            "similarity_boost": 0.85,
            "style": 0.10,
            "use_speaker_boost": True
        },
        "acoustic_params": acoustic_params,
        "sample_file": sample_filename
    }
    
    save_custom_voice(voice_record)
    return voice_record

def create_designed_voice(
    name: str,
    gender: str,
    age: str,
    accent: str,
    accent_strength: float = 1.0,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a new synthetic voice profile via Voice Design parameters.
    """
    voice_id = f"gen_{uuid.uuid4().hex[:16]}"
    
    # Calculate pitch and timbre based on gender & age
    if gender.lower() == "female":
        if age == "young":
            f0 = 230.0
            semitones = 3.5
            formant = 1.12
            presence = 3800.0
            warmth = 1.0
        elif age == "old":
            f0 = 175.0
            semitones = 0.0
            formant = 0.98
            presence = 3000.0
            warmth = 2.0
        else:  # middle-aged
            f0 = 200.0
            semitones = 2.0
            formant = 1.05
            presence = 3500.0
            warmth = 1.4
    else:  # male
        if age == "young":
            f0 = 140.0
            semitones = -2.5
            formant = 0.95
            presence = 3200.0
            warmth = 2.0
        elif age == "old":
            f0 = 100.0
            semitones = -5.5
            formant = 0.88
            presence = 2600.0
            warmth = 3.5
        else:  # middle-aged
            f0 = 120.0
            semitones = -4.0
            formant = 0.92
            presence = 2900.0
            warmth = 2.8
            
    acoustic_params = {
        "gender": gender,
        "f0_hz": f0,
        "pitch_shift_semitones": semitones,
        "formant_shift": formant,
        "presence_frequency": presence,
        "warmth_boost_db": warmth,
        "speaking_rate": 1.0 if age != "old" else 0.92
    }
    
    voice_record = {
        "voice_id": voice_id,
        "name": name,
        "category": "generated",
        "description": description or f"Generated {age} {gender} voice with {accent} accent",
        "preview_url": f"/v1/voices/{voice_id}/preview",
        "labels": {
            "gender": gender,
            "age": age,
            "accent": accent,
            "use_case": "conversational",
            "tone": f"{age} {gender}"
        },
        "settings": {
            "stability": 0.50,
            "similarity_boost": 0.75,
            "style": round(accent_strength * 0.1, 2),
            "use_speaker_boost": True
        },
        "acoustic_params": acoustic_params
    }
    
    save_custom_voice(voice_record)
    return voice_record

