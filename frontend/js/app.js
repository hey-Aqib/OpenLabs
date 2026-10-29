const API_BASE = "";
/**
 * OpenLabs Studio - Voice Synthesis & Cloning Controller
 * Manages Voice Selection, Sliders, Web Audio Canvas Visualizer,
 * Microphone Recording, Karaoke Synchronization, and REST/WebSocket API Calls.
 */

// Application State
const state = {
  voices: [],
  selectedVoiceId: "21m00Tcm4TlvDq8ikWAM", // Default: Rachel
  audioElement: null,
  audioBlobUrl: null,
  alignment: null,
  words: [],
  isPlaying: false,
  audioDuration: 0,
  playbackSpeed: 1.0,
  // Microphone recording state
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
  uploadedAudioFile: null,
  // Web Audio API for waveform
  audioCtx: null,
  analyser: null,
  sourceNode: null
};

// Preset Prompts
const PRESET_PROMPTS = {
  narration: "The ancient library stood atop the mist-shrouded cliff, its towering shelves holding thousands of handwritten grimoires. In the quiet halls, only the soft rustle of turning parchment broke the deep, eternal silence.",
  conversational: "Hey there! I was just thinking about that machine learning paper you mentioned yesterday. The architectural flow-matching diffusion approach is genuinely impressive. Do you want to run some tests together?",
  trailer: "In a world shattered by digital anomalies, one rogue AI engineer discovered the frequency to rewrite reality itself. Prepare for the ultimate broadcast.",
  asmr: "Close your eyes... take a slow, deep breath in... and let go of all the tension in your shoulders. Listen to the gentle whisper of the autumn rain against the windowpane."
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  state.audioElement = document.getElementById("audio-player");
  setupNavigation();
  setupSliders();
  setupTextEditor();
  setupPlayer();
  setupVoiceLab();
  setupLibraryFilters();

  // Load Voices & History from Backend
  await loadVoices();
  await loadHistory();
});

// ========================================================
// 1. NAVIGATION & TABS
// ========================================================
function setupNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");
      
      // Update Tab Styles
      tabs.forEach(t => {
        t.classList.remove("active", "bg-indigo-600", "text-white");
        t.classList.add("text-slate-400");
      });
      tab.classList.add("active");
      tab.classList.remove("text-slate-400");

      // Update Panels
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.remove("hidden");
        targetPanel.classList.add("active");
      }

      if (targetId === "tab-library") {
        renderVoiceGrid("all");
      } else if (targetId === "tab-history") {
        loadHistory();
      }
    });
  });
}

// ========================================================
// 2. VOICES LOADING & SELECTION
// ========================================================
const FALLBACK_VOICES = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade", labels: { gender: "female", accent: "american", age: "young", use_case: "narration" }, description: "Calm, natural female voice" },
  { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", category: "premade", labels: { gender: "female", accent: "american", age: "young", use_case: "conversational" }, description: "Strong, authentic female voice" },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade", labels: { gender: "female", accent: "american", age: "young", use_case: "narration" }, description: "Gentle, pleasant female voice" },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade", labels: { gender: "male", accent: "american", age: "young", use_case: "narration" }, description: "Well-rounded, versatile male voice" },
  { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Josh", category: "premade", labels: { gender: "male", accent: "american", age: "young", use_case: "narration" }, description: "Deep, soothing male voice" },
  { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", category: "premade", labels: { gender: "male", accent: "american", age: "middle_aged", use_case: "narration" }, description: "Crisp, authoritative male voice" },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", category: "premade", labels: { gender: "male", accent: "american", age: "middle_aged", use_case: "narration" }, description: "Deep, resonant male voice" },
  { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", category: "premade", labels: { gender: "male", accent: "american", age: "young", use_case: "narration" }, description: "Dynamic, versatile male voice" }
];

async function loadVoices() {
  try {
    const res = await fetch(`${API_BASE}/v1/voices`);
    const ct = res.headers.get("content-type") || "";
    if (res.ok && ct.includes("application/json")) {
      const data = await res.json();
      if (data && data.voices && data.voices.length > 0) {
        state.voices = data.voices;
      }
    }
  } catch (err) {
    console.warn("API voice fetch deferred, using built-in voices:", err);
  }

  if (!state.voices || state.voices.length === 0) {
    state.voices = [...FALLBACK_VOICES];
  }

  const select = document.getElementById("voice-select");
  if (select) {
    select.innerHTML = "";
    state.voices.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.voice_id;
      const categoryTag = v.category === "cloned" ? " [CLONED]" : "";
      opt.textContent = `${v.name} (${v.labels?.accent || "Standard"}, ${v.labels?.gender || "Voice"})${categoryTag}`;
      select.appendChild(opt);
    });
  }

  if (state.voices.length > 0) {
    selectVoice(state.selectedVoiceId || state.voices[0].voice_id);
  }
  if (typeof renderVoiceGrid === "function") {
    renderVoiceGrid("all");
  }
}


function selectVoice(voiceId) {
  const voice = state.voices.find(v => v.voice_id === voiceId) || state.voices[0];
  if (!voice) return;

  state.selectedVoiceId = voice.voice_id;
  document.getElementById("voice-select").value = voice.voice_id;
  document.getElementById("voice-display-name").textContent = voice.name;
  document.getElementById("voice-display-desc").textContent = voice.description || "High-fidelity neural voice";

  const badge = document.getElementById("voice-category-badge");
  badge.textContent = voice.category || "premade";
  badge.className = voice.category === "cloned"
    ? "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300"
    : "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300";

  const avatar = document.getElementById("voice-avatar");
  avatar.textContent = voice.name.charAt(0).toUpperCase();

  // Load Voice Settings default if available
  if (voice.settings) {
    setSlider("slider-stability", "stability-val", voice.settings.stability);
    setSlider("slider-similarity", "similarity-val", voice.settings.similarity_boost);
    setSlider("slider-style", "style-val", voice.settings.style);
    document.getElementById("toggle-speaker-boost").checked = voice.settings.use_speaker_boost;
  }
}

document.getElementById("voice-select")?.addEventListener("change", (e) => {
  selectVoice(e.target.value);
});

document.getElementById("preview-voice-btn")?.addEventListener("click", () => {
  playVoicePreview(state.selectedVoiceId);
});

async function playVoicePreview(voiceId) {
  try {
    const audio = state.audioElement;
    audio.src = `${API_BASE}/v1/voices/${voiceId}/preview`;
    await audio.play();
    state.isPlaying = true;
    updatePlayButtonState();
    showToast("Playing voice preview...", "info");
  } catch (err) {
    showToast("Preview error: " + err.message, "error");
  }
}

// ========================================================
// 3. SLIDERS & CONTROLS
// ========================================================
function setupSliders() {
  bindSlider("slider-stability", "stability-val");
  bindSlider("slider-similarity", "similarity-val");
  bindSlider("slider-style", "style-val");
  bindSlider("design-accent-strength", "accent-strength-val", "x");

  document.getElementById("reset-sliders-btn")?.addEventListener("click", () => {
    setSlider("slider-stability", "stability-val", 0.50);
    setSlider("slider-similarity", "similarity-val", 0.75);
    setSlider("slider-style", "style-val", 0.05);
    document.getElementById("toggle-speaker-boost").checked = true;
  });
}

function bindSlider(sliderId, valId, suffix = "") {
  const slider = document.getElementById(sliderId);
  const valDisplay = document.getElementById(valId);
  if (!slider || !valDisplay) return;

  slider.addEventListener("input", () => {
    valDisplay.textContent = parseFloat(slider.value).toFixed(2) + suffix;
  });
}

function setSlider(sliderId, valId, val) {
  const slider = document.getElementById(sliderId);
  const valDisplay = document.getElementById(valId);
  if (slider && valDisplay) {
    slider.value = val;
    valDisplay.textContent = parseFloat(val).toFixed(2);
  }
}

// ========================================================
// 4. TEXT EDITOR & PRESETS
// ========================================================
function setupTextEditor() {
  const textarea = document.getElementById("tts-input-text");
  const charCounter = document.getElementById("char-counter");
  const wordCount = document.getElementById("word-count");
  const estDuration = document.getElementById("est-duration");
  const presetSelect = document.getElementById("preset-prompts");

  // Default text
  textarea.value = PRESET_PROMPTS.narration;
  updateTextStats();

  textarea.addEventListener("input", updateTextStats);

  presetSelect.addEventListener("change", (e) => {
    const key = e.target.value;
    if (PRESET_PROMPTS[key]) {
      textarea.value = PRESET_PROMPTS[key];
      updateTextStats();
    }
  });

  document.getElementById("clear-text-btn")?.addEventListener("click", () => {
    textarea.value = "";
    updateTextStats();
  });

  function updateTextStats() {
    const text = textarea.value;
    charCounter.textContent = `${text.length.toLocaleString()} / 5,000 characters`;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCount.textContent = `${words} words`;
    // ~150 words per minute => ~2.5 words per second
    const estSec = (words / 2.5).toFixed(1);
    estDuration.textContent = `Estimated: ~${estSec}s`;
  }
}

// ========================================================
// 5. AUDIO SYNTHESIS EXECUTION
// ========================================================
document.getElementById("generate-btn")?.addEventListener("click", generateSpeech);

async function generateSpeech() {
  const text = document.getElementById("tts-input-text").value.trim();
  if (!text) {
    showToast("Please enter some text to synthesize.", "warning");
    return;
  }

  const generateBtn = document.getElementById("generate-btn");
  const btnText = document.getElementById("generate-btn-text");
  const isStreaming = document.getElementById("stream-toggle").checked;

  generateBtn.disabled = true;
  btnText.textContent = isStreaming ? "Streaming..." : "Synthesizing...";
  showToast("Synthesizing audio with neural acoustic engine...", "info");

  const modelId = document.getElementById("model-select").value;
  const voiceSettings = {
    stability: parseFloat(document.getElementById("slider-stability").value),
    similarity_boost: parseFloat(document.getElementById("slider-similarity").value),
    style: parseFloat(document.getElementById("slider-style").value),
    use_speaker_boost: document.getElementById("toggle-speaker-boost").checked
  };

  try {
    if (isStreaming) {
      // Chunked Streaming
      await handleStreamingSynthesis(text, modelId, voiceSettings);
    } else {
      // Non-streaming with Timestamps
      await handleTimestampedSynthesis(text, modelId, voiceSettings);
    }
    showToast("Generation complete!", "success");
    await loadHistory();
  } catch (err) {
    showToast("Synthesis failed: " + err.message, "error");
  } finally {
    generateBtn.disabled = false;
    btnText.textContent = "Generate Speech";
  }
}

async function handleTimestampedSynthesis(text, modelId, settings) {
  const url = `${API_BASE}/v1/text-to-speech/${state.selectedVoiceId}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: settings
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Server error");
  }

  const data = await res.json();
  const audioBlob = b64toBlob(data.audio_base64, "audio/mpeg");
  loadAudioBlob(audioBlob);

  // Setup alignment & karaoke words
  state.alignment = data.alignment;
  renderKaraokeWords(data.alignment);
}

async function handleStreamingSynthesis(text, modelId, settings) {
  const url = `${API_BASE}/v1/text-to-speech/${state.selectedVoiceId}/stream?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: settings
    })
  });

  if (!res.ok) throw new Error("Streaming connection failed");

  const blob = await res.blob();
  loadAudioBlob(blob);
}

function b64toBlob(b64Data, contentType = 'audio/mpeg') {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

// ========================================================
// 6. AUDIO PLAYER & WAVEFORM VISUALIZER
// ========================================================
function setupPlayer() {
  const audio = state.audioElement;
  const playPauseBtn = document.getElementById("play-pause-btn");
  const waveformWrapper = document.getElementById("waveform-wrapper");

  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    state.isPlaying = true;
    updatePlayButtonState();
  });

  audio.addEventListener("pause", () => {
    state.isPlaying = false;
    updatePlayButtonState();
  });

  audio.addEventListener("ended", () => {
    state.isPlaying = false;
    updatePlayButtonState();
    clearKaraokeHighlight();
  });

  audio.addEventListener("timeupdate", () => {
    updatePlaybackTimeline();
    syncKaraoke(audio.currentTime);
  });

  waveformWrapper.addEventListener("click", (e) => {
    if (!state.audioDuration) return;
    const rect = waveformWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = progress * state.audioDuration;
  });

  // Speed Buttons
  document.querySelectorAll(".speed-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".speed-btn").forEach(b => {
        b.classList.remove("active", "bg-indigo-600", "text-white");
        b.classList.add("text-slate-400");
      });
      btn.classList.add("active", "bg-indigo-600", "text-white");
      btn.classList.remove("text-slate-400");

      const speed = parseFloat(btn.getAttribute("data-speed"));
      state.playbackSpeed = speed;
      audio.playbackRate = speed;
    });
  });

  // Download Button
  document.getElementById("download-mp3-btn")?.addEventListener("click", () => {
    if (!state.audioBlobUrl) return;
    const a = document.createElement("a");
    a.href = state.audioBlobUrl;
    a.download = `openlabs_speech_${state.selectedVoiceId}.mp3`;
    a.click();
  });
}

function loadAudioBlob(blob) {
  if (state.audioBlobUrl) {
    URL.revokeObjectURL(state.audioBlobUrl);
  }
  state.audioBlobUrl = URL.createObjectURL(blob);
  const audio = state.audioElement;
  audio.src = state.audioBlobUrl;
  audio.playbackRate = state.playbackSpeed;

  audio.onloadedmetadata = () => {
    state.audioDuration = audio.duration;
    document.getElementById("time-total").textContent = formatTime(audio.duration);
    document.getElementById("player-status-title").textContent = "Speech Generated";
    document.getElementById("play-pause-btn").disabled = false;
    document.getElementById("download-mp3-btn").disabled = false;
    document.getElementById("playhead-line").classList.remove("hidden");
    
    // Draw synthetic waveform representation
    drawWaveform();
    audio.play();
  };
}

function updatePlayButtonState() {
  const icon = document.getElementById("play-icon");
  if (state.isPlaying) {
    icon.setAttribute("data-lucide", "pause");
  } else {
    icon.setAttribute("data-lucide", "play");
  }
  if (window.lucide) lucide.createIcons();
}

function updatePlaybackTimeline() {
  const audio = state.audioElement;
  document.getElementById("time-current").textContent = formatTime(audio.currentTime);

  if (state.audioDuration > 0) {
    const pct = (audio.currentTime / state.audioDuration) * 100;
    document.getElementById("playhead-line").style.left = `${pct}%`;
  }
}

function formatTime(sec) {
  if (isNaN(sec) || sec <= 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Waveform Canvas Rendering
function drawWaveform() {
  const canvas = document.getElementById("waveform-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, rect.width, rect.height);

  const numBars = Math.floor(rect.width / 4);
  const barWidth = 2.5;
  const gap = 1.5;
  const hMid = rect.height / 2;

  // Render stylized audio bars
  for (let i = 0; i < numBars; i++) {
    // Generate organic pseudo-amplitude
    const seed = Math.sin(i * 0.18) * Math.cos(i * 0.08);
    const height = Math.max(6, Math.abs(seed) * (rect.height * 0.75));

    const x = i * (barWidth + gap);
    const y = hMid - height / 2;

    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, "#818cf8");
    grad.addColorStop(1, "#4f46e5");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, height, 2);
    ctx.fill();
  }
}

// ========================================================
// 7. KARAOKE WORD-LEVEL ALIGNMENT
// ========================================================
function renderKaraokeWords(alignment) {
  const container = document.getElementById("karaoke-words");
  const wrapper = document.getElementById("karaoke-container");
  if (!container || !alignment) return;

  wrapper.classList.remove("hidden");
  container.innerHTML = "";

  // Aggregate characters into words with start and end times
  state.words = aggregateWords(alignment);

  state.words.forEach((w, index) => {
    const span = document.createElement("span");
    span.className = "karaoke-word text-slate-300";
    span.textContent = w.word;
    span.id = `k-word-${index}`;
    span.addEventListener("click", () => {
      state.audioElement.currentTime = w.start;
    });
    container.appendChild(span);
  });
}

function aggregateWords(alignment) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const words = [];
  let curr = [];
  let wordStart = null;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === " " || ".!?,;:".includes(c)) {
      if (curr.length > 0) {
        words.push({
          word: curr.join(""),
          start: wordStart,
          end: ends[i - 1] || ends[i]
        });
        curr = [];
        wordStart = null;
      }
    } else {
      if (wordStart === null) wordStart = starts[i];
      curr.push(c);
    }
  }
  if (curr.length > 0) {
    words.push({
      word: curr.join(""),
      start: wordStart,
      end: ends[ends.length - 1]
    });
  }
  return words;
}

function syncKaraoke(currentTime) {
  if (!state.words || state.words.length === 0) return;

  state.words.forEach((w, i) => {
    const el = document.getElementById(`k-word-${i}`);
    if (el) {
      if (currentTime >= w.start && currentTime <= w.end) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  });
}

function clearKaraokeHighlight() {
  document.querySelectorAll(".karaoke-word").forEach(w => w.classList.remove("active"));
}

// ========================================================
// 8. VOICE LAB (CLONING & DESIGN)
// ========================================================
function setupVoiceLab() {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("clone-file-input");
  const fileChosen = document.getElementById("file-chosen-name");
  const micToggleBtn = document.getElementById("mic-toggle-btn");
  const micBtnLabel = document.getElementById("mic-btn-label");
  const micDot = document.getElementById("mic-status-dot");
  const micText = document.getElementById("mic-status-text");

  // File Upload Handling
  dropArea.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      state.uploadedAudioFile = e.target.files[0];
      fileChosen.textContent = `Selected: ${state.uploadedAudioFile.name}`;
      fileChosen.classList.remove("hidden");
    }
  });

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("border-indigo-500");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("border-indigo-500");
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("border-indigo-500");
    if (e.dataTransfer.files.length > 0) {
      state.uploadedAudioFile = e.dataTransfer.files[0];
      fileChosen.textContent = `Selected: ${state.uploadedAudioFile.name}`;
      fileChosen.classList.remove("hidden");
    }
  });

  // Live Microphone Recording via Web Audio API
  micToggleBtn.addEventListener("click", async () => {
    if (!state.isRecording) {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioChunks = [];
        state.mediaRecorder = new MediaRecorder(stream);

        state.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) state.audioChunks.push(e.data);
        };

        state.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(state.audioChunks, { type: "audio/wav" });
          state.uploadedAudioFile = new File([audioBlob], "microphone_sample.wav", { type: "audio/wav" });
          fileChosen.textContent = "Recorded: microphone_sample.wav (" + (audioBlob.size / 1024).toFixed(1) + " KB)";
          fileChosen.classList.remove("hidden");
        };

        state.mediaRecorder.start();
        state.isRecording = true;
        micBtnLabel.textContent = "Stop Recording";
        micDot.className = "w-2.5 h-2.5 rounded-full bg-red-500 animate-ping";
        micText.textContent = "Recording in progress...";
        showToast("Recording microphone audio...", "info");
      } catch (err) {
        showToast("Microphone access denied: " + err.message, "error");
      }
    } else {
      // Stop Recording
      state.mediaRecorder.stop();
      state.mediaRecorder.stream.getTracks().forEach(t => t.stop());
      state.isRecording = false;
      micBtnLabel.textContent = "Record Again";
      micDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
      micText.textContent = "Microphone sample ready!";
      showToast("Audio recorded successfully!", "success");
    }
  });

  // Submit Voice Clone
  document.getElementById("create-clone-btn")?.addEventListener("click", async () => {
    const name = document.getElementById("clone-name").value.trim();
    if (!name) {
      showToast("Please enter a voice name.", "warning");
      return;
    }
    if (!state.uploadedAudioFile) {
      showToast("Please select an audio file or record from microphone.", "warning");
      return;
    }

    const desc = document.getElementById("clone-desc").value.trim();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("files", state.uploadedAudioFile);
    if (desc) formData.append("description", desc);

    showToast("Analyzing voice profile and extracting acoustic timbres...", "info");

    try {
      const res = await fetch(`${API_BASE}/v1/voices/add`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Voice cloning failed");

      const data = await res.json();
      showToast(`Voice cloned successfully! (ID: ${data.voice_id})`, "success");
      await loadVoices();
      selectVoice(data.voice_id);

      // Switch to synthesis tab
      document.querySelector('[data-tab="tab-synthesis"]').click();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Submit Voice Design
  document.getElementById("create-design-btn")?.addEventListener("click", async () => {
    const name = document.getElementById("design-name").value.trim() || "Designed Voice";
    const gender = document.getElementById("design-gender").value;
    const age = document.getElementById("design-age").value;
    const accent = document.getElementById("design-accent").value;
    const strength = parseFloat(document.getElementById("design-accent-strength").value);

    try {
      showToast("Generating synthetic voice profile...", "info");
      const res = await fetch(`${API_BASE}/v1/voices/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          gender: gender,
          age: age,
          accent: accent,
          accent_strength: strength
        })
      });
      if (!res.ok) throw new Error("Design voice failed");

      const data = await res.json();
      showToast(`Voice "${name}" created!`, "success");
      await loadVoices();
      selectVoice(data.voice_id);
      document.querySelector('[data-tab="tab-synthesis"]').click();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ========================================================
// 9. VOICE LIBRARY GRID
// ========================================================
function setupLibraryFilters() {
  document.querySelectorAll(".lib-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lib-filter").forEach(b => {
        b.classList.remove("active", "bg-indigo-600", "text-white");
        b.classList.add("text-slate-400");
      });
      btn.classList.add("active", "bg-indigo-600", "text-white");
      btn.classList.remove("text-slate-400");

      const filter = btn.getAttribute("data-filter");
      renderVoiceGrid(filter);
    });
  });
}

function renderVoiceGrid(filter = "all") {
  const grid = document.getElementById("voice-grid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered = state.voices.filter(v => {
    if (filter === "all") return true;
    if (filter === "premade") return v.category === "premade";
    if (filter === "cloned") return v.category === "cloned";
    if (filter === "female") return v.labels?.gender === "female";
    if (filter === "male") return v.labels?.gender === "male";
    return true;
  });

  filtered.forEach(v => {
    const card = document.createElement("div");
    card.className = "bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group";

    const isCloned = v.category === "cloned";
    const badgeColor = isCloned ? "bg-emerald-500/20 text-emerald-300" : "bg-indigo-500/20 text-indigo-300";

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
              ${v.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">${v.name}</h4>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${badgeColor}">${v.category}</span>
            </div>
          </div>
          <button class="play-preview-card p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" data-voice-id="${v.voice_id}" title="Play Sample">
            <i data-lucide="volume-2" class="w-4 h-4"></i>
          </button>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">${v.description || "Versatile neural voice."}</p>
        <div class="flex flex-wrap gap-1.5 mb-4">
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">${v.labels?.accent || "American"}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">${v.labels?.gender || "Neutral"}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">${v.labels?.use_case || "General"}</span>
        </div>
      </div>

      <button class="use-voice-btn w-full py-2 px-3 rounded-xl bg-slate-800 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5" data-voice-id="${v.voice_id}">
        <span>Use in Playground</span>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
      </button>
    `;

    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();

  // Attach card events
  grid.querySelectorAll(".play-preview-card").forEach(btn => {
    btn.addEventListener("click", () => {
      playVoicePreview(btn.getAttribute("data-voice-id"));
    });
  });

  grid.querySelectorAll(".use-voice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectVoice(btn.getAttribute("data-voice-id"));
      document.querySelector('[data-tab="tab-synthesis"]').click();
    });
  });
}

// ========================================================
// 10. GENERATION HISTORY
// ========================================================
async function loadHistory() {
  const container = document.getElementById("history-container");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/v1/history`);
    const data = await res.json();
    const history = data.history || [];

    if (history.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          <i data-lucide="history" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          <p class="text-sm">No generations yet. Synthesize text to populate history.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = "";
    history.forEach(item => {
      const card = document.createElement("div");
      card.className = "bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors";

      const dateStr = new Date(item.date_unix * 1000).toLocaleString();

      card.innerHTML = `
        <div class="flex items-center gap-3.5 min-w-0">
          <button class="hist-play-btn w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors flex-shrink-0" data-hist-id="${item.history_item_id}">
            <i data-lucide="play" class="w-4 h-4 ml-0.5"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm text-slate-200">${item.voice_name}</span>
              <span class="text-[10px] text-slate-500 font-mono">${dateStr}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">${item.duration_seconds || 0}s</span>
            </div>
            <p class="text-xs text-slate-400 truncate max-w-xl mt-0.5">${item.text}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <a href="${API_BASE}/v1/history/${item.history_item_id}/audio" download="generation_${item.history_item_id}.mp3" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Download Audio">
            <i data-lucide="download" class="w-4 h-4"></i>
          </a>
          <button class="hist-delete-btn p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" data-hist-id="${item.history_item_id}" title="Delete">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

    // Attach History Actions
    container.querySelectorAll(".hist-play-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const histId = btn.getAttribute("data-hist-id");
        state.audioElement.src = `${API_BASE}/v1/history/${histId}/audio`;
        state.audioElement.play();
        state.isPlaying = true;
        updatePlayButtonState();
      });
    });

    container.querySelectorAll(".hist-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const histId = btn.getAttribute("data-hist-id");
        await fetch(`${API_BASE}/v1/history/${histId}`, { method: "DELETE" });
        await loadHistory();
      });
    });

  } catch (err) {
    console.error("Failed to load history:", err);
  }
}

document.getElementById("refresh-history-btn")?.addEventListener("click", loadHistory);

// ========================================================
// 11. TOAST NOTIFICATION UTILITY
// ========================================================
let toastTimeout;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-msg");
  const icon = document.getElementById("toast-icon");
  if (!toast || !msg) return;

  msg.textContent = message;

  if (type === "error") {
    icon.setAttribute("data-lucide", "alert-circle");
    icon.className = "w-4 h-4 text-red-400";
  } else if (type === "warning") {
    icon.setAttribute("data-lucide", "alert-triangle");
    icon.className = "w-4 h-4 text-amber-400";
  } else if (type === "success") {
    icon.setAttribute("data-lucide", "check-circle");
    icon.className = "w-4 h-4 text-emerald-400";
  } else {
    icon.setAttribute("data-lucide", "info");
    icon.className = "w-4 h-4 text-sky-400";
  }

  if (window.lucide) lucide.createIcons();

  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

