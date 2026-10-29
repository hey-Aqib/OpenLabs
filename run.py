"""
OpenLabs Studio - One-Click Launcher
Starts the FastAPI application and serves both the OpenLabs v1 API and OpenLabs Studio UI.
"""
import os
import sys
import webbrowser
import uvicorn

def main():
    print("=" * 65)
    print("          OPENLABS STUDIO - VOICE SYNTHESIS & CLONING ENGINE")
    print("=" * 65)
    print(" [✓] OpenLabs v1 Speech & Streaming API")
    print(" [✓] Local High-Fidelity Acoustic DSP & Voice Synthesizer")
    print(" [✓] Zero-Shot Instant Voice Cloning & Voice Design")
    print(" [✓] Realtime Web Audio Waveform Visualizer & Word Alignment")
    print(" [✓] HTTP Chunked & WebSocket Bidirectional Streaming")
    print("-" * 65)
    print(" Server Running at:  http://127.0.0.1:8000")
    print(" Interactive Docs:   http://127.0.0.1:8000/docs")
    print(" OpenLabs Studio:    http://127.0.0.1:8000/")
    print("=" * 65)

    if "--open" in sys.argv or "-o" in sys.argv:
        webbrowser.open("http://127.0.0.1:8000/")

    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()

