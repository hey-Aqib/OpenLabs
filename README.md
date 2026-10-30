# OpenLabs — Full-Stack Neural Voice Synthesis & Cloning Platform

OpenLabs is an independent, full-stack voice generation platform and developer API providing human-like prosody, zero-shot instant voice cloning, real-time waveform visualizers, and low-latency audio streaming.

Built with **Next.js (App Router), TypeScript, Tailwind CSS, and Node.js Web APIs**, it runs as a unified, 100% self-contained full-stack application ready for **1-Click Vercel Deployment** with zero separate backend infrastructure needed.

---

## 🚀 Key Features

| Feature | OpenLabs Engine Capability |
| :--- | :--- |
| **Full-Stack Architecture** | Unified Next.js application with React frontend and Serverless API routes |
| **Vercel Ready** | Deploy directly to Vercel in 1 click with zero configuration or external backend |
| **Acoustic Models** | `openlabs_multilingual_v2`, `openlabs_flash_v2_5`, `openlabs_turbo_v2`, `openlabs_neural_v1` |
| **Premade Voices** | Curated catalog: Rachel, Domi, Bella, Antoni, Josh, Arnold, Adam, Sam, Nicole, George |
| **Stability (0.0 - 1.0)** | Micro-jitter & prosodic variance vs. monotonic RMS envelope flattening |
| **Clarity / Similarity (0.0 - 1.0)** | Formant tracking & harmonic frequency exciter (2.5kHz - 7kHz) |
| **Style Exaggeration (0.0 - 1.0)** | Non-linear dynamic expansion for dramatic emotional delivery |
| **Speaker Boost (bool)** | Multi-band vocal presence shelf (+3.6dB @ 3.3kHz) & soft-knee broadcast limiter |
| **Instant Voice Cloning** | Upload audio files or record directly via browser microphone $\to$ zero-shot speaker adaptation |
| **Live Karaoke Sync** | Millisecond-accurate character & word timestamps with active word highlighting |
| **Waveform Canvas** | Real-time oscilloscope visualizer synced with audio playback |
| **REST API** | Standard endpoints (`/v1/text-to-speech`, `/v1/voices`, `/v1/models`, `/v1/history`) |

---

## 📁 Project Architecture

```
OpenLabs/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with Obsidian Dark theme & metadata
│   │   ├── globals.css        # Tailwind CSS + custom glowing sliders & karaoke styles
│   │   ├── page.tsx           # Obsidian Dark Studio UI (Synthesis, Cloning, Library, History, API)
│   │   └── api/
│   │       └── v1/
│   │           ├── voices/
│   │           │   ├── route.ts         # GET /v1/voices (Voice catalog)
│   │           │   └── add/route.ts     # POST /v1/voices/add (Instant Voice Cloning)
│   │           ├── models/route.ts      # GET /v1/models (Acoustic models)
│   │           ├── text-to-speech/
│   │           │   └── [voice_id]/
│   │           │       ├── route.ts              # POST /v1/text-to-speech/{id} (MP3 audio stream)
│   │           │       └── with-timestamps/route.ts # POST /v1/text-to-speech/{id}/with-timestamps (JSON + timestamps)
│   │           └── history/route.ts     # GET /v1/history (Generation logs)
│   └── lib/
│       ├── voices.ts          # Curated voice catalog & acoustic parameter store
│       ├── models.ts          # Acoustic model definitions
│       ├── synthesizer.ts     # Speech synthesis orchestrator with multi-tier fallback
│       ├── alignment.ts       # Character & word timestamp alignment generator
│       ├── cloner.ts          # Instant voice cloning feature extractor
│       └── history.ts         # In-memory history persistence
├── next.config.mjs            # Next.js config with /v1/* rewrites to /api/v1/*
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Node.js dependencies
└── backend/                   # Python reference engine & DSP implementations
```

---

## ⚡ Quickstart (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## ☁️ Deploy to Vercel (1-Click)

Because OpenLabs is now a complete full-stack Next.js project, you do **not** need a separate Python backend deployment:

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) $\to$ **Add New Project** $\to$ Import your GitHub repository.
3. Framework Preset will be automatically detected as **Next.js**.
4. Click **Deploy**!
5. Your Studio UI and all `/v1/...` REST API routes will be live instantly on your Vercel URL.

---

## 💻 Developer API Reference

### cURL

```bash
curl -X POST "https://your-domain.vercel.app/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world from OpenLabs", "model_id": "openlabs_multilingual_v2"}' \
  --output speech.mp3
```

### Python SDK

```python
import requests

url = "https://your-domain.vercel.app/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
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

print("Speech saved to speech.mp3!")
```

---

## 📄 License

Apache-2.0. Open-source, independent neural voice synthesis platform.
