---
title: OpenLabs
emoji: 🎙️
colorFrom: indigo
colorTo: purple
sdk: gradio
app_file: app.py
pinned: false
license: apache-2.0
---

# OpenLabs — High-Fidelity Voice Synthesis & Cloning Engine

OpenLabs is an independent, full-stack voice generation platform and developer API providing human-like prosody, zero-shot instant voice cloning, and low-latency audio streaming.

Built with an open-source audio DSP pipeline, real-time waveform visualizers, and full REST & WebSocket streaming support.

---

## 🚀 Key Features

| Feature | OpenLabs Engine Capability |
| :--- | :--- |
| **Acoustic Models** | `openlabs_multilingual_v2`, `openlabs_flash_v2_5`, `openlabs_turbo_v2`, `openlabs_neural_v1` |
| **Premade Voices** | Curated catalog: Rachel, Adam, Antoni, Josh, Bella, Sam, Nicole, George, Arnold |
| **Stability (0.0 - 1.0)** | Micro-jitter & prosodic variance vs. monotonic RMS envelope flattening filter |
| **Similarity / Clarity (0.0 - 1.0)** | Formant tracking & harmonic frequency exciter (2.5kHz - 7kHz) |
| **Style Exaggeration (0.0 - 1.0)** | Non-linear dynamic expansion ($y = \text{sign}(x) \cdot |x|^{(1.0 - 0.25 \times \text{style})}$) |
| **Speaker Boost (bool)** | Multi-band vocal presence shelf (+3.6dB @ 3.3kHz) & soft-knee broadcast limiter |
| **Instant Voice Cloning** | Upload 1-3 audio files or record via browser microphone $\to$ zero-shot speaker adaptation |
| **Voice Design** | Parametric synthetic voice creation from Gender, Age, Accent, and Accent Strength |
| **Audio Streaming** | HTTP Chunked Transfer & WebSocket bidirectional streams (`/stream-input`) |
| **Word Alignment** | Millisecond-accurate character & word timestamps with live karaoke highlighting |
| **API Architecture** | Clean REST API (`/v1/text-to-speech`, `/v1/voices`, `/v1/models`, `/v1/history`) |

---

## 📁 Project Architecture

```
OpenLabs/
├── backend/
│   ├── app.py                 # FastAPI application & v1 routes
│   ├── engine/
│   │   ├── synthesizer.py     # Speech synthesis coordinator & format encoders
│   │   ├── dsp.py             # 4-parameter acoustic DSP pipeline
│   │   ├── voice_cloner.py    # Zero-shot voice profiling & instant cloner
│   │   ├── alignment.py       # Character & word timestamp alignment generator
│   │   └── history_manager.py # Generation history & audio persistence
│   ├── models/
│   │   ├── schemas.py         # Pydantic schemas for public API
│   │   └── voice_catalog.py   # Voice profiles catalog & custom voice storage
│   └── data/
│       ├── voices/            # Persisted custom cloned voices (.json)
│       └── history/           # Persisted generation records & audio files (.mp3)
├── frontend/
│   ├── index.html             # Studio UI (Playground, Voice Lab, Library, History, API)
│   ├── css/
│   │   └── style.css          # Dark-mode styling, glowing sliders, custom scrollbars
│   └── js/
│       └── app.js             # State manager, canvas waveform, mic recorder & karaoke
├── tests/
│   └── test_api_parity.py     # End-to-end integration test suite
├── requirements.txt           # Python package dependencies
├── run.py                     # One-click startup script
└── README.md
```

---

## 🛠️ Quick Start & Setup

### 1. Requirements
- Python 3.10+ (tested on Python 3.13)
- Windows / Linux / macOS

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Studio Server
```bash
python run.py --open
```

Open your browser to:
- **Studio Interface**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Running Automated Tests

Run the full end-to-end test suite:
```bash
pytest tests/test_api_parity.py -v
```

All 7 integration tests verify:
1. `GET /v1/models` — model discovery
2. `GET /v1/voices` — premade and custom voice retrieval
3. `POST /v1/text-to-speech/{voice_id}` — standard audio generation
4. `POST /v1/text-to-speech/{voice_id}/with-timestamps` — alignment & base64 audio
5. `POST /v1/text-to-speech/{voice_id}/stream` — chunked audio streaming
6. `POST /v1/voices/add` — instant voice cloning from audio file
7. `GET /v1/history` & audio playback — history logging and retrieval

---

## 🚀 How to Deploy OpenLabs

### Option 1: Docker (Recommended for VPS / Cloud)
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg libsndfile1 espeak-ng && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
```
Build & run:
```bash
docker build -t openlabs .
docker run -p 8000:8000 openlabs
```

### Option 2: Render / Railway / Fly.io
1. Connect your GitHub repository (`https://github.com/hey-Aqib/OpenLabs.git`).
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`

### Option 3: Hugging Face Spaces (Docker Space)
1. Create a new Space with SDK: **Docker**.
2. Push your repo. Hugging Face will automatically build and host the app with free compute.
