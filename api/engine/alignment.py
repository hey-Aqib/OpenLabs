"""
Speech Alignment & Word-Level Timestamp Generator
Generates character-level and word-level alignment data structures for speech synthesis.
"""
from typing import Dict, List, Any
from api.models.schemas import Alignment

VOWELS = set("aeiouyAEIOUY")
PLOSIVES = set("ptkbdgPTKBDG")
PUNCTUATION = {'.': 0.35, '!': 0.35, '?': 0.40, ',': 0.20, ';': 0.25, ':': 0.25, '-': 0.15}

def generate_alignment(text: str, total_duration: float) -> Alignment:
    """
    Computes character-level timestamps by weighting phonemic durations and pause boundaries.
    """
    if not text or total_duration <= 0:
        return Alignment(characters=[], character_start_times_seconds=[], character_end_times_seconds=[])
        
    chars = list(text)
    weights = []
    
    # Calculate duration weight per character
    for c in chars:
        if c in PUNCTUATION:
            weights.append(3.0)  # Punctuation pauses
        elif c == ' ':
            weights.append(1.0)  # Inter-word space
        elif c in VOWELS:
            weights.append(2.0)  # Vowels sustain longer
        elif c in PLOSIVES:
            weights.append(1.2)  # Plosives are quick
        else:
            weights.append(1.5)  # Other consonants
            
    total_weight = sum(weights)
    if total_weight <= 0:
        total_weight = len(chars)
        weights = [1.0] * len(chars)
        
    # Scale each character to fit total_duration
    start_times = []
    end_times = []
    current_time = 0.0
    
    for w in weights:
        char_duration = (w / total_weight) * total_duration
        start_times.append(round(current_time, 3))
        current_time += char_duration
        end_times.append(round(current_time, 3))
        
    # Ensure last end time matches total_duration
    if end_times:
        end_times[-1] = round(total_duration, 3)
        
    return Alignment(
        characters=chars,
        character_start_times_seconds=start_times,
        character_end_times_seconds=end_times
    )

def alignment_to_words(alignment: Alignment) -> List[Dict[str, Any]]:
    """
    Aggregates character-level timestamps into word-level timestamps for UI caption display.
    """
    chars = alignment.characters
    starts = alignment.character_start_times_seconds
    ends = alignment.character_end_times_seconds
    
    words = []
    current_chars = []
    word_start = None
    
    for i, c in enumerate(chars):
        if c == " " or c in PUNCTUATION:
            if current_chars:
                words.append({
                    "word": "".join(current_chars),
                    "start": word_start,
                    "end": ends[i - 1]
                })
                current_chars = []
                word_start = None
        else:
            if word_start is None:
                word_start = starts[i]
            current_chars.append(c)
            
    if current_chars:
        words.append({
            "word": "".join(current_chars),
            "start": word_start,
            "end": ends[-1]
        })
        
    return words

