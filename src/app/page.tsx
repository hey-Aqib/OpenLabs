"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  Radio,
  BookOpen,
  History,
  Code2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Upload,
  Square,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels: {
    accent?: string;
    gender?: string;
    age?: string;
    use_case?: string;
  };
}

interface Model {
  model_id: string;
  name: string;
  description: string;
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

const PREMADE_VOICES: Voice[] = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade", labels: { gender: "female", accent: "american" }, description: "Calm, natural female voice with warm mid-range presence." },
  { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", category: "premade", labels: { gender: "female", accent: "american" }, description: "Strong, authentic female voice with crisp articulation." },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade", labels: { gender: "female", accent: "american" }, description: "Gentle, pleasant female voice with soft breathiness." },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade", labels: { gender: "male", accent: "american" }, description: "Well-rounded, versatile male voice with clear diction." },
  { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Josh", category: "premade", labels: { gender: "male", accent: "american" }, description: "Deep, soothing male voice with rich lower-chest resonance." },
  { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", category: "premade", labels: { gender: "male", accent: "american" }, description: "Authoritative, crisp male voice with heavy presence." },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", category: "premade", labels: { gender: "male", accent: "american" }, description: "Deep, resonant male voice with broadcast radio clarity." },
  { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", category: "premade", labels: { gender: "male", accent: "american" }, description: "Dynamic, fast-paced male voice with youthful energy." },
  { voice_id: "piTKgcLEGmPE4e6mEKli", name: "Nicole", category: "premade", labels: { gender: "female", accent: "american" }, description: "Intimate, whispered female tone for storytelling." },
  { voice_id: "JBFqnCBsd6RMkjVDRZzb", name: "George", category: "premade", labels: { gender: "male", accent: "british" }, description: "Warm, British storytelling cadence with rich gravitas." }
];

const AVAILABLE_MODELS: Model[] = [
  { model_id: "openlabs_multilingual_v2", name: "OpenLabs Multilingual v2", description: "Flagship multilingual model with rich emotional prosody." },
  { model_id: "openlabs_flash_v2_5", name: "OpenLabs Flash v2.5", description: "Ultra-low latency streaming model." },
  { model_id: "openlabs_turbo_v2", name: "OpenLabs Turbo v2", description: "High-throughput neural engine." },
  { model_id: "openlabs_neural_v1", name: "OpenLabs Neural v1", description: "Direct local acoustic synthesis engine." }
];

function extractWordTimestamps(alignment: any): WordTimestamp[] {
  if (!alignment || !alignment.characters) return [];
  const words: WordTimestamp[] = [];
  let currentWord = "";
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];

    if (/\s|[.,!?;:]/.test(char)) {
      if (currentWord.trim()) {
        words.push({ word: currentWord.trim(), start: wordStart, end: wordEnd });
        currentWord = "";
      }
    } else {
      if (!currentWord) wordStart = start;
      currentWord += char;
      wordEnd = end;
    }
  }
  if (currentWord.trim()) {
    words.push({ word: currentWord.trim(), start: wordStart, end: wordEnd });
  }
  return words;
}

export default function OpenLabsStudio() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"synth" | "clone" | "library" | "history" | "api">("synth");

  // Synthesis controls
  const [text, setText] = useState<string>(
    "Hello! OpenLabs is an independent, open-source neural voice synthesis engine. You can adjust stability, clarity, and style exaggeration in real time."
  );
  const [voices, setVoices] = useState<Voice[]>(PREMADE_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("21m00Tcm4TlvDq8ikWAM");
  const [selectedModelId, setSelectedModelId] = useState<string>("openlabs_multilingual_v2");

  // DSP Settings
  const [stability, setStability] = useState<number>(0.50);
  const [similarity, setSimilarity] = useState<number>(0.75);
  const [style, setStyle] = useState<number>(0.05);
  const [speakerBoost, setSpeakerBoost] = useState<boolean>(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true);

  // Audio Playback & Diagnostics
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);
  const [alignment, setAlignment] = useState<Alignment | null>(null);
  const [words, setWords] = useState<WordTimestamp[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Voice Cloning
  const [cloneName, setCloneName] = useState<string>("");
  const [cloneDesc, setCloneDesc] = useState<string>("");
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneResult, setCloneResult] = useState<string | null>(null);

  // History & Code
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Initial Load: Fetch voices & history
  useEffect(() => {
    fetchVoices();
    fetchHistory();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await fetch("/v1/voices");
      if (res.ok) {
        const data = await res.json();
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
        }
      }
    } catch (e) {
      console.warn("Using fallback voices", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/v1/history");
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistoryItems(data.history);
        }
      }
    } catch (e) {
      console.warn("Could not fetch history", e);
    }
  };

  // 2. Synthesize Speech
  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setDiagnostics("Synthesizing neural audio with DSP pipeline...");

    const startTime = performance.now();
    try {
      const res = await fetch(`/v1/text-to-speech/${selectedVoiceId}/with-timestamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: selectedModelId,
          voice_settings: {
            stability,
            similarity_boost: similarity,
            style,
            use_speaker_boost: speakerBoost,
          },
        }),
      });

      if (!res.ok) throw new Error("Synthesis failed with status " + res.status);

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      const byteCharacters = atob(data.audio_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mime_type || "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
      setAudioDuration(data.duration_seconds);
      setAlignment(data.alignment);
      
      const extracted = extractWordTimestamps(data.alignment);
      setWords(extracted);

      setDiagnostics(
        `Synthesized successfully: ${text.length} chars | Duration: ${data.duration_seconds.toFixed(2)}s | Latency: ${elapsed}ms | Speed: ${(
          (data.duration_seconds * 1000) /
          Math.max(1, text.length)
        ).toFixed(1)}ms/char`
      );

      fetchHistory();

      // Auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 100);
    } catch (err: any) {
      setDiagnostics("Error during synthesis: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Audio Time Update & Karaoke Sync
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setAudioCurrentTime(cur);

    if (words.length > 0) {
      const idx = words.findIndex((w) => cur >= w.start && cur <= w.end);
      setCurrentWordIndex(idx);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // 4. Waveform Canvas Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      ctx.lineWidth = 2;
      ctx.strokeStyle = isPlaying ? "#f97316" : "#6366f1";
      ctx.shadowBlur = isPlaying ? 10 : 4;
      ctx.shadowColor = isPlaying ? "#f97316" : "#6366f1";

      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const freq = isPlaying ? 0.05 : 0.02;
        const amp = isPlaying ? Math.sin(phase + x * 0.03) * 16 + 6 : 4;
        const y = mid + Math.sin(x * freq + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isPlaying) phase += 0.12;
      else phase += 0.02;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // 5. Microphone Recording for Voice Cloning
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      alert("Microphone permission denied: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 6. Voice Cloning Submission
  const handleCloneVoice = async () => {
    if (!cloneName.trim()) {
      alert("Please provide a name for the voice clone.");
      return;
    }
    if (!cloneFile && !recordedBlob) {
      alert("Please upload an audio file or record a sample with your microphone.");
      return;
    }

    setIsCloning(true);
    setCloneResult("Extracting vocal tract resonances, F0 fundamental pitch, and spectral timbre...");

    try {
      const formData = new FormData();
      formData.append("name", cloneName);
      formData.append("description", cloneDesc || "Instant neural voice clone");
      
      if (cloneFile) {
        formData.append("files", cloneFile);
      } else if (recordedBlob) {
        formData.append("files", recordedBlob, "microphone_sample.wav");
      }

      const res = await fetch("/v1/voices/add", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Cloning failed");
      const data = await res.json();

      setCloneResult(
        `Voice '${data.name}' cloned successfully!\n` +
        `• Voice ID: ${data.voice_id}\n` +
        `• Fundamental F0: ${data.acoustic_params.f0_hz} Hz\n` +
        `• Pitch Shift: ${data.acoustic_params.pitch_shift_semitones} semitones\n` +
        `• Gender Profile: ${data.acoustic_params.gender}\n` +
        `The voice has been added to your catalog and is ready to synthesize.`
      );

      await fetchVoices();
      setSelectedVoiceId(data.voice_id);
    } catch (err: any) {
      setCloneResult("Error during cloning: " + err.message);
    } finally {
      setIsCloning(false);
    }
  };

  // Sample prompt buttons
  const setSamplePrompt = (sampleText: string) => {
    setText(sampleText);
  };

  // Copy helper
  const copyCode = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const currentVoice = voices.find((v) => v.voice_id === selectedVoiceId) || voices[0];

  return (
    <main className="min-h-screen bg-[#080c14] text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. STUDIO HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900/80 border border-indigo-500/30 p-6 mb-6 shadow-2xl shadow-indigo-950/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-2xl">
              🎙️
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-100 bg-clip-text text-transparent">
                OpenLabs Studio
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                High-Fidelity Neural Speech Synthesis, Instant Voice Cloning & Acoustic DSP Workstation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              Full-Stack Engine Online
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              100% Vercel Ready
            </span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
        {[
          { id: "synth", label: "Speech Synthesis", icon: Radio },
          { id: "clone", label: "Voice Lab (Instant Voice Cloning)", icon: Mic },
          { id: "library", label: "Voice Library", icon: BookOpen },
          { id: "history", label: "History", icon: History },
          { id: "api", label: "Developer API", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/20 to-indigo-500/20 border border-orange-500/50 text-orange-400 shadow-md shadow-orange-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: SPEECH SYNTHESIS */}
      {activeTab === "synth" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Inputs & Settings) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Prompt Box */}
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Text Prompt
                </label>
                <span className="text-xs text-slate-400 font-mono">{text.length} chars</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste any text to synthesize into natural, high-fidelity speech..."
                rows={5}
                className="w-full bg-[#111827] border border-slate-700/60 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all resize-none"
              />
            </div>

            {/* Voice & Model Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-4">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Voice Character
                </label>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {voices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name} ({v.labels.accent || "Standard"}, {v.labels.gender || "Voice"})
                      {v.category === "cloned" ? " [CLONED]" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                  {currentVoice?.description || "High-fidelity neural voice"}
                </p>
              </div>

              <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-4">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Acoustic Model
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                  {AVAILABLE_MODELS.find((m) => m.model_id === selectedModelId)?.description}
                </p>
              </div>
            </div>

            {/* Advanced Voice Settings (Accordion) */}
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#111827]/50 hover:bg-[#111827] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Advanced Voice Settings (DSP & Acoustics)
                  </span>
                </div>
                {isAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isAccordionOpen && (
                <div className="p-5 space-y-5 border-t border-slate-800/80">
                  {/* Slider: Stability */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-slate-300">
                        Stability (Variance vs Consistency)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-400">{stability.toFixed(2)}</span>
                        <button onClick={() => setStability(0.5)} className="text-slate-400 hover:text-slate-200">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={stability}
                      onChange={(e) => setStability(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-orange-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Lower = dynamic prosodic variance. Higher = steady monotonic tone.
                    </p>
                  </div>

                  {/* Slider: Clarity / Similarity Boost */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-slate-300">
                        Clarity / Similarity Boost
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-400">{similarity.toFixed(2)}</span>
                        <button onClick={() => setSimilarity(0.75)} className="text-slate-400 hover:text-slate-200">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={similarity}
                      onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-orange-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Enhances reference timbre presence and spectral excitation.
                    </p>
                  </div>

                  {/* Slider: Style Exaggeration & Speaker Boost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-slate-300">Style Exaggeration</span>
                        <span className="text-xs font-mono font-bold text-orange-400">{style.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={style}
                        onChange={(e) => setStyle(parseFloat(e.target.value))}
                        className="w-full cursor-pointer accent-orange-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Non-linear dynamic emotional delivery.</p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 sm:pt-0">
                      <input
                        type="checkbox"
                        id="speakerBoost"
                        checked={speakerBoost}
                        onChange={(e) => setSpeakerBoost(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-800 border-slate-700 cursor-pointer"
                      />
                      <label htmlFor="speakerBoost" className="text-xs font-medium text-slate-200 cursor-pointer">
                        Speaker Boost (Vocal Presence)
                        <span className="block text-[11px] text-slate-400">
                          Enables vocal shelf (+3.6dB @ 3.3kHz) & broadcast limiter.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Glowing Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Neural Speech...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-orange-300" />
                  ✨ Generate Speech
                </>
              )}
            </button>
          </div>

          {/* Right Column (Audio Output & Diagnostics) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Audio Output Player Card */}
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  Synthesized Audio Output
                </span>
                {audioDuration > 0 && (
                  <span className="text-xs font-mono text-slate-400">
                    {audioCurrentTime.toFixed(1)}s / {audioDuration.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Real-time Oscilloscope Canvas */}
              <div className="w-full h-24 bg-[#080c14] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative mb-4">
                <canvas ref={canvasRef} width={450} height={96} className="w-full h-full" />
                {!audioUrl && !isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 pointer-events-none">
                    Generate audio to view waveform
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              {audioUrl ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 1}
                      step={0.01}
                      value={audioCurrentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (audioRef.current) audioRef.current.currentTime = val;
                        setAudioCurrentTime(val);
                      }}
                      className="w-full cursor-pointer accent-orange-500"
                    />
                  </div>

                  <a
                    href={audioUrl}
                    download={`openlabs_${currentVoice?.name || "speech"}.mp3`}
                    className="p-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                    title="Download MP3"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                  Awaiting generation
                </div>
              )}

              {/* Live Karaoke Highlight synced with playback */}
              {words.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#080c14] border border-slate-800/80 text-sm leading-relaxed max-h-36 overflow-y-auto">
                  {words.map((w, idx) => (
                    <span
                      key={idx}
                      className={`karaoke-word ${idx === currentWordIndex ? "karaoke-active" : "text-slate-300"}`}
                    >
                      {w.word}{" "}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Synthesis Diagnostics Box */}
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Synthesis Diagnostics
              </label>
              <div className="min-h-16 p-3 rounded-xl bg-[#080c14] border border-slate-800 font-mono text-xs text-slate-400">
                {diagnostics || "Ready for speech synthesis prompt."}
              </div>
            </div>

            {/* Sample Prompts */}
            <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-3">
                Sample Test Prompts
              </label>
              <div className="space-y-2">
                {[
                  {
                    title: "Podcast Intro",
                    text: "Welcome back to the Deep Tech podcast. Today we are exploring the future of generative audio and open speech engines.",
                  },
                  {
                    title: "Documentary Narration",
                    text: "Deep within the ancient mountains, a silent river has carved its path for millions of uninterrupted centuries.",
                  },
                  {
                    title: "Urdu / Hindi Greeting",
                    text: "Aap sab ko OpenLabs mein khushamdeed! Yeh platform neural voice synthesis aur voice cloning free tier par chalata hai.",
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSamplePrompt(sample.text)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-xs font-medium text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span>{sample.title}</span>
                    <span className="text-[10px] text-orange-400 font-mono">Use prompt →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: VOICE LAB (CLONING) */}
      {activeTab === "clone" && (
        <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Mic className="w-5 h-5 text-orange-400" />
              Instant Zero-Shot Voice Cloning
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upload an audio sample (or record directly via your microphone) to extract vocal tract resonances, F0 fundamental pitch, and spectral timbre identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Voice Name
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="e.g. My Studio Voice"
                  className="w-full bg-[#111827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={cloneDesc}
                  onChange={(e) => setCloneDesc(e.target.value)}
                  placeholder="Conversational tone with warm low-end presence..."
                  className="w-full bg-[#111827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Reference Audio Sample (Upload or Record)
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-orange-500 text-xs text-slate-300 transition-colors">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>{cloneFile ? cloneFile.name : "Upload audio (WAV/MP3)"}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCloneFile(e.target.files[0]);
                          setRecordedBlob(null);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      isRecording
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" /> Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-red-400" /> Record Mic
                      </>
                    )}
                  </button>
                </div>
                {recordedBlob && (
                  <p className="text-[11px] text-emerald-400 mt-2 font-mono">
                    ✓ Microphone sample captured ({recordedBlob.size} bytes)
                  </p>
                )}
              </div>

              <button
                onClick={handleCloneVoice}
                disabled={isCloning}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isCloning ? "Cloning Voice Profile..." : "🧬 Clone Voice Instantly"}
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Cloning Results & Acoustic Profile
              </label>
              <div className="h-64 p-4 rounded-xl bg-[#080c14] border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line overflow-y-auto">
                {cloneResult || "Submit an audio sample to extract vocal tract acoustic features."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: VOICE LIBRARY */}
      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Available Voice Profiles in OpenLabs
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Explore premade neural voices and custom zero-shot clones.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voices.map((v) => (
              <div
                key={v.voice_id}
                className="bg-[#0c121e] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                      {v.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">{v.name}</h3>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                        {v.labels.gender} • {v.labels.accent}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      v.category === "cloned"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    }`}
                  >
                    {v.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-10">
                  {v.description || "High-fidelity neural voice"}
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {v.voice_id.substring(0, 8)}...
                  </span>
                  <button
                    onClick={() => {
                      setSelectedVoiceId(v.voice_id);
                      setActiveTab("synth");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Use in Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 4: HISTORY */}
      {activeTab === "history" && (
        <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                Recent Generation Log
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Audited list of neural syntheses generated on this OpenLabs instance.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
            >
              Refresh
            </button>
          </div>

          {historyItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No generations recorded yet. Synthesize speech in the Studio tab to start logging.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Voice</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Prompt Excerpt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {historyItems.map((item) => (
                    <tr key={item.history_item_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-200">{item.voice_name}</td>
                      <td className="py-3 px-4 text-slate-400">{item.model_id}</td>
                      <td className="py-3 px-4 text-orange-400">{item.duration_seconds.toFixed(2)}s</td>
                      <td className="py-3 px-4 text-slate-300 font-sans max-w-xs truncate">{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: DEVELOPER API */}
      {activeTab === "api" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              OpenLabs Full-Stack v1 REST API Reference
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              You can synthesize speech and clone voices directly through Next.js API route handlers using any client (Python, cURL, Node.js).
            </p>
          </div>

          {/* cURL Snippet */}
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">cURL Example</span>
              <button
                onClick={() =>
                  copyCode(
                    `curl -X POST "/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "Hello world from OpenLabs", "model_id": "openlabs_multilingual_v2"}' \\\n  --output speech.mp3`,
                    "curl"
                  )
                }
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedSnippet === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSnippet === "curl" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#080c14] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -X POST "/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello world from OpenLabs", "model_id": "openlabs_multilingual_v2"}' \\
  --output speech.mp3`}
            </pre>
          </div>

          {/* Python Example */}
          <div className="bg-[#0c121e] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Python Example</span>
              <button
                onClick={() =>
                  copyCode(
                    `import requests\n\nurl = "http://localhost:3000/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"\npayload = {\n    "text": "Hello from OpenLabs neural voice platform!",\n    "model_id": "openlabs_multilingual_v2",\n    "voice_settings": {\n        "stability": 0.50,\n        "similarity_boost": 0.75,\n        "style": 0.05,\n        "use_speaker_boost": True\n    }\n}\n\nresponse = requests.post(url, json=payload)\nwith open("speech.mp3", "wb") as f:\n    f.write(response.content)\nprint("Speech saved to speech.mp3!")`,
                    "python"
                  )
                }
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedSnippet === "python" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSnippet === "python" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#080c14] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
{`import requests

url = "http://localhost:3000/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
payload = {
    "text": "Hello from OpenLabs neural voice platform!",
    "model_id": "openlabs_multilingual_v2",
    "voice_settings": {
        "stability": 0.50,
        "similarity_boost": 0.75,
        "style": 0.05,
        "use_speaker_boost": True
    }
}

response = requests.post(url, json=payload)
with open("speech.mp3", "wb") as f:
    f.write(response.content)
print("Speech saved to speech.mp3!")`}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

