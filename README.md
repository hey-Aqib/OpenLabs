# OpenLabs — Neural Voice Synthesis & Cloning Platform

OpenLabs is an independent, full-stack voice generation platform and developer API providing human-like prosody, zero-shot instant voice cloning, real-time waveform visualizers, and low-latency audio streaming.

Built with **Next.js (React + Tailwind CSS) Frontend** and a **Pure Python FastAPI Backend**, structured for **1-Click Vercel Deployment** with zero external backend hosting required.

---

## 🚀 Key Features

| Feature | OpenLabs Engine Capability |
| :--- | :--- |
| **Python FastAPI Backend** | Pure Python engine (`backend/app.py` & `api/index.py`) running as Serverless Functions on Vercel |
| **Next.js Studio Frontend** | Modern Obsidian Dark interface with real-time waveform visualizer canvas & glowing controls |
| **1-Click Vercel Deployment** | Single repository containing both Next.js frontend and Python backend — deploy directly to Vercel |
| **Acoustic Models** | `openlabs_multilingual_v2`, `openlabs_flash_v2_5`, `openlabs_turbo_v2`, `openlabs_neural_v1` |
| **Premade Voices** | Curated catalog: Rachel, Domi, Bella, Antoni, Josh, Arnold, Adam, Sam, Nicole, George |
| **Stability (0.0 - 1.0)** | Micro-jitter & prosodic variance vs. monotonic RMS envelope flattening |
| **Clarity / Similarity (0.0 - 1.0)** | Formant tracking & harmonic frequency exciter (2.5kHz - 7kHz) |
| **Style Exaggeration (0.0 - 1.0)** | Non-linear dynamic expansion for dramatic emotional delivery |
| **Speaker Boost (bool)** | Multi-band vocal presence shelf (+3.6dB @ 3.3kHz) & soft-knee broadcast limiter |
| **Instant Voice Cloning** | Upload audio files or record directly via browser microphone $\to$ zero-shot speaker adaptation |
| **Live Karaoke Sync** | Millisecond-accurate character & word timestamps with active word highlighting |
| **REST API** | Standard endpoints (`/v1/text-to-speech`, `/v1/voices`, `/v1/models`, `/v1/history`) |

---

## 📁 Clean Project Architecture

```
OpenLabs/
├── api/
│   └── index.py               # Vercel Serverless Python entrypoint (exposes FastAPI app)
├── backend/                   # Pure Python FastAPI backend & DSP engine
│   ├── app.py                 # FastAPI application & v1 REST routes
│   ├── engine/
│   │   ├── synthesizer.py     # Speech synthesis coordinator with DSP & cloud/acoustic fallback
│   │   ├── dsp.py             # 4-parameter acoustic DSP pipeline
│   │   ├── voice_cloner.py    # Zero-shot voice profiling & instant cloner
│   │   ├── alignment.py       # Character & word timestamp alignment generator
│   │   └── history_manager.py # Generation history & audio persistence
│   ├── models/
│   │   ├── schemas.py         # Pydantic schemas for public API
│   │   └── voice_catalog.py   # Voice profiles catalog & custom voice storage
│   └── data/
│       ├── voices/            # Persisted custom cloned voices (.json)
│       └── history/           # Persisted generation records (.json)
├── src/
│   └── app/
│       ├── layout.tsx         # Root layout with Obsidian Dark theme & metadata
│       ├── globals.css        # Tailwind CSS + custom glowing sliders & karaoke styles
│       └── page.tsx           # Obsidian Dark Studio UI (Synthesis, Cloning, Library, History, API)
├── vercel.json                # Vercel Serverless routing (/v1/* -> /api/index.py)
├── next.config.mjs            # Next.js config with development & production rewrites
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Node.js dependencies
└── requirements.txt           # Python backend dependencies
```

---

## ⚡ Quickstart (Local Development)

### 1. Install Dependencies
```bash
# Node dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### 2. Run Locally
- **Start Python Backend:**
  ```bash
  uvicorn backend.app:app --reload --port 8000
  ```
- **Start Next.js Frontend:**
  ```bash
  npm run dev
  ```
Open [http://localhost:3000](http://localhost:3000) to open the Studio.

---

## ☁️ Deploy to Vercel (1-Click Deployment)

Because Vercel natively supports Next.js frontend with Python Serverless Functions in `api/`:

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) $\to$ **Add New Project** $\to$ Import your GitHub repository.
3. Framework Preset will be automatically detected as **Next.js**.
4. Click **Deploy**!
5. Vercel automatically builds the Next.js frontend and compiles the Python backend (`api/index.py`). Both frontend and backend will be live on your Vercel URL with zero separate infrastructure!

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
    "text": "Hello from OpenLabs pure Python neural voice platform!",
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
