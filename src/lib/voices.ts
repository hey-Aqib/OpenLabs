export interface VoiceLabels {
  accent: string;
  gender: string;
  age: string;
  use_case: string;
}

export interface VoiceSettings {
  stability: number; // 0.0 - 1.0
  similarity_boost: number; // 0.0 - 1.0
  style: number; // 0.0 - 1.0
  use_speaker_boost: boolean;
}

export interface AcousticParams {
  f0_hz: number;
  pitch_shift_semitones: number;
  formant_shift_ratio: number;
  speaking_rate: number;
  gender: "female" | "male" | "neutral";
}

export interface Voice {
  voice_id: string;
  name: string;
  category: "premade" | "cloned" | "generated";
  description?: string;
  labels: VoiceLabels;
  preview_url?: string;
  settings?: VoiceSettings;
  acoustic_params?: AcousticParams;
}

export const PREMADE_VOICES: Voice[] = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    category: "premade",
    description: "Calm, natural female voice with warm mid-range presence. Ideal for long-form narration, meditation, and storytelling.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "narration" },
    settings: { stability: 0.50, similarity_boost: 0.75, style: 0.05, use_speaker_boost: true },
    acoustic_params: { f0_hz: 215.0, pitch_shift_semitones: 0.0, formant_shift_ratio: 1.0, speaking_rate: 1.0, gender: "female" }
  },
  {
    voice_id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    category: "premade",
    description: "Strong, authentic female voice with crisp articulation and assertive dynamic range. Ideal for podcasts and commercial spots.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "conversational" },
    settings: { stability: 0.45, similarity_boost: 0.80, style: 0.10, use_speaker_boost: true },
    acoustic_params: { f0_hz: 228.0, pitch_shift_semitones: 1.0, formant_shift_ratio: 1.03, speaking_rate: 1.05, gender: "female" }
  },
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    category: "premade",
    description: "Gentle, pleasant female voice with soft breathiness. Perfect for audiobooks, poetry, and reflective essays.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "narration" },
    settings: { stability: 0.60, similarity_boost: 0.70, style: 0.02, use_speaker_boost: true },
    acoustic_params: { f0_hz: 240.0, pitch_shift_semitones: 1.8, formant_shift_ratio: 1.05, speaking_rate: 0.95, gender: "female" }
  },
  {
    voice_id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    category: "premade",
    description: "Well-rounded, versatile male voice with clear diction. Suitable for corporate training, explainers, and technical tutorials.",
    labels: { accent: "american", gender: "male", age: "young", use_case: "narration" },
    settings: { stability: 0.55, similarity_boost: 0.75, style: 0.05, use_speaker_boost: true },
    acoustic_params: { f0_hz: 125.0, pitch_shift_semitones: 0.0, formant_shift_ratio: 1.0, speaking_rate: 1.0, gender: "male" }
  },
  {
    voice_id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Josh",
    category: "premade",
    description: "Deep, soothing male voice with rich lower-chest resonance. Excellent for cinematic narration and deep dive documentaries.",
    labels: { accent: "american", gender: "male", age: "young", use_case: "narration" },
    settings: { stability: 0.50, similarity_boost: 0.85, style: 0.08, use_speaker_boost: true },
    acoustic_params: { f0_hz: 102.0, pitch_shift_semitones: -3.0, formant_shift_ratio: 0.92, speaking_rate: 0.96, gender: "male" }
  },
  {
    voice_id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    category: "premade",
    description: "Authoritative, crisp middle-aged male voice with heavy presence and vocal weight. Perfect for military or hard news.",
    labels: { accent: "american", gender: "male", age: "middle_aged", use_case: "narration" },
    settings: { stability: 0.65, similarity_boost: 0.80, style: 0.12, use_speaker_boost: true },
    acoustic_params: { f0_hz: 98.0, pitch_shift_semitones: -3.5, formant_shift_ratio: 0.89, speaking_rate: 0.94, gender: "male" }
  },
  {
    voice_id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    category: "premade",
    description: "Deep, resonant male voice with commanding delivery and broadcast-grade radio clarity.",
    labels: { accent: "american", gender: "male", age: "middle_aged", use_case: "narration" },
    settings: { stability: 0.52, similarity_boost: 0.82, style: 0.05, use_speaker_boost: true },
    acoustic_params: { f0_hz: 110.0, pitch_shift_semitones: -2.0, formant_shift_ratio: 0.95, speaking_rate: 0.98, gender: "male" }
  },
  {
    voice_id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam",
    category: "premade",
    description: "Dynamic, fast-paced male voice with youthful energy. Ideal for YouTube videos, TikTok voiceovers, and ads.",
    labels: { accent: "american", gender: "male", age: "young", use_case: "narration" },
    settings: { stability: 0.40, similarity_boost: 0.70, style: 0.15, use_speaker_boost: true },
    acoustic_params: { f0_hz: 135.0, pitch_shift_semitones: 1.2, formant_shift_ratio: 1.02, speaking_rate: 1.08, gender: "male" }
  },
  {
    voice_id: "piTKgcLEGmPE4e6mEKli",
    name: "Nicole",
    category: "premade",
    description: "Intimate, whispered female tone with delicate acoustic timbre. Tailored for ASMR and psychological drama.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "audiobook" },
    settings: { stability: 0.70, similarity_boost: 0.60, style: 0.00, use_speaker_boost: false },
    acoustic_params: { f0_hz: 200.0, pitch_shift_semitones: -1.0, formant_shift_ratio: 0.98, speaking_rate: 0.88, gender: "female" }
  },
  {
    voice_id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    category: "premade",
    description: "Warm, sophisticated British male voice with Oxford cadence and rich gravitas.",
    labels: { accent: "british", gender: "male", age: "middle_aged", use_case: "storytelling" },
    settings: { stability: 0.58, similarity_boost: 0.78, style: 0.04, use_speaker_boost: true },
    acoustic_params: { f0_hz: 118.0, pitch_shift_semitones: -1.0, formant_shift_ratio: 0.97, speaking_rate: 0.97, gender: "male" }
  }
];

// In-memory catalog store with persistence
let customVoices: Voice[] = [];

export function getAllVoices(): Voice[] {
  return [...PREMADE_VOICES, ...customVoices];
}

export function getVoiceById(voiceId: string): Voice | undefined {
  return getAllVoices().find(v => v.voice_id === voiceId);
}

export function addClonedVoice(voice: Voice): Voice {
  customVoices.push(voice);
  return voice;
}

export function deleteVoice(voiceId: string): boolean {
  const initialLen = customVoices.length;
  customVoices = customVoices.filter(v => v.voice_id !== voiceId);
  return customVoices.length < initialLen;
}
