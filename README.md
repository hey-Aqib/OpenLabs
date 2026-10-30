# OpenLabs — Full-Stack Neural Voice Synthesis & Cloning Workstation

OpenLabs is an independent, full-stack voice generation platform and developer API providing human-like prosody, zero-shot instant voice cloning, real-time waveform visualizers, and low-latency audio streaming.

Built as a **unified Full-Stack Next.js project with an integrated Python FastAPI backend (`api/`)**, ready for **1-Click Vercel Deployment** with zero external backend hosting required.

---

## 🚀 Key Features

| Feature | OpenLabs Engine Capability |
| :--- | :--- |
| **Unified Full-Stack Architecture** | Next.js Studio frontend + integrated Python FastAPI backend (`api/`) |
| **1-Click Vercel Deployment** | Zero separate backend folders; Vercel compiles Next.js and runs `api/index.py` as Serverless Functions |
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

## 📁 Clean Full-Stack Next.js Architecture

```
OpenLabs/
├── api/                       # Integrated Python FastAPI Backend (Vercel Serverless)
│   ├── index.py               # FastAPI application & REST route definitions
│   ├── engine/                # Synthesizer, 4-param DSP pipeline, cloner, alignment, history
│   ├── models/                # Pydantic schemas & voice catalog
│   └── data/                  # Cloned voice profiles & history records
├── src/                       # Next.js Studio Frontend
│   └── app/
│       ├── layout.tsx         # Root layout with Obsidian Dark theme & metadata
│       ├── globals.css        # Tailwind CSS + custom glowing sliders & karaoke styles
│       └── page.tsx           # Obsidian Dark Studio UI (Synthesis, Cloning, Library, History, API)
├── vercel.json                # Vercel Serverless routing (/v1/* -> /api/index.py)
├── next.config.mjs            # Next.js rewrites configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Node.js dependencies & scripts
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
- **Start Integrated Python Backend:**
  ```bash
  npm run fastapi-dev
  # or: uvicorn api.index:app --reload --port 8000
  ```
- **Start Next.js Frontend:**
  ```bash
  npm run dev
  ```
Open [http://localhost:3000](http://localhost:3000) to open the Studio.

---

## ☁️ Deploy to Vercel (1-Click Deployment)

Because Vercel natively supports Next.js with Python Serverless Functions in `api/`:

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) $\to$ **Add New Project** $\to$ Import your GitHub repository.
3. Framework Preset will be automatically detected as **Next.js**.
4. Click **Deploy**!
5. Vercel automatically deploys both your Next.js Studio and the Python FastAPI backend on the same URL!

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
