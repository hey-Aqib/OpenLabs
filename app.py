"""
OpenLabs Studio - Hugging Face Space Entrypoint
High-Fidelity Neural Speech Synthesis, Instant Voice Cloning, and Acoustic DSP Workstation.
ZeroGPU Free compatible with native Gradio Obsidian interface and REST API routes.
"""
import os
import tempfile
import html
from pathlib import Path
from typing import Tuple, List, Optional
import gradio as gr

# Hugging Face ZeroGPU Free Compatibility Check
try:
    import spaces
    HAS_ZEROGPU = True
except ImportError:
    HAS_ZEROGPU = False

from backend.models.voice_catalog import get_all_voices, get_all_voices_dict, get_voice_by_id
from backend.models.schemas import VoiceSettings
from backend.engine.synthesizer import SpeechSynthesizer
from backend.engine.voice_cloner import create_instant_voice_clone
from backend.engine.history_manager import save_history_record, get_history_items
from backend.app import app as backend_fastapi_app

synthesizer = SpeechSynthesizer()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_INDEX = BASE_DIR / "frontend" / "index.html"

def get_voice_choices() -> List[str]:
    voices = get_all_voices()
    return [f"{v.name} ({v.category})" for v in voices]

def find_voice_id_by_label(label: str) -> str:
    voices = get_all_voices()
    clean_name = label.split(" (")[0].strip()
    for v in voices:
        if v.name == clean_name:
            return v.voice_id
    return voices[0].voice_id if voices else "21m00Tcm4TlvDq8ikWAM"

def _do_synthesize(
    text: str,
    voice_label: str,
    model_id: str,
    stability: float,
    similarity: float,
    style: float,
    speaker_boost: bool
):
    if not text or not text.strip():
        text = "Welcome to OpenLabs. Enter any prompt to synthesize speech."
        
    voice_id = find_voice_id_by_label(voice_label)
    settings = VoiceSettings(
        stability=float(stability),
        similarity_boost=float(similarity),
        style=float(style),
        use_speaker_boost=bool(speaker_boost)
    )
    
    audio_bytes, dur, align, mime = synthesizer.synthesize(
        text=text.strip(),
        voice_id=voice_id,
        model_id=model_id,
        voice_settings=settings,
        output_format="mp3_44100_128"
    )
    
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    tmp.write(audio_bytes)
    tmp.close()
    
    voice_name = voice_label.split(" (")[0]
    save_history_record(
        voice_id=voice_id,
        voice_name=voice_name,
        voice_category="premade",
        model_id=model_id,
        text=text,
        audio_bytes=audio_bytes,
        duration_seconds=dur,
        settings=settings
    )
    
    status_summary = (
        f"Synthesized successfully: {len(align.characters)} chars | Duration: {dur:.2f}s | "
        f"Speed: {dur*1000/max(1, len(text)):.1f}ms/char"
    )
    
    return tmp.name, status_summary

if HAS_ZEROGPU:
    generate_speech = spaces.GPU(_do_synthesize)
else:
    generate_speech = _do_synthesize

def clone_voice_handler(name: str, audio_path: str, description: str):
    if not name or not audio_path:
        return "Error: Please specify a Voice Name and provide an audio sample (upload or record).", gr.update()
        
    try:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
            
        ext = Path(audio_path).suffix.lstrip(".") or "wav"
        record = create_instant_voice_clone(
            name=name.strip(),
            audio_bytes=audio_bytes,
            file_ext=ext,
            description=description.strip() if description else None
        )
        
        f0 = record.get("acoustic_params", {}).get("f0_hz", 175)
        gender = record.get("acoustic_params", {}).get("gender", "neutral")
        semitones = record.get("acoustic_params", {}).get("pitch_shift_semitones", 0.0)
        
        msg = (
            f"Voice '{name}' cloned successfully!\n"
            f"• Voice ID: {record['voice_id']}\n"
            f"• Gender Profile: {gender.capitalize()}\n"
            f"• Fundamental F0: {f0:.1f} Hz\n"
            f"• Pitch Offset: {semitones:+.2f} semitones\n"
            f"The new voice is now ready for synthesis in the Studio tab."
        )
        
        new_choices = get_voice_choices()
        return msg, gr.update(choices=new_choices, value=f"{name} (cloned)")
    except Exception as e:
        return f"Error cloning voice: {str(e)}", gr.update()

def get_voice_catalog_table():
    voices = get_all_voices()
    rows = []
    for v in voices:
        gender = v.labels.get("gender", "-")
        accent = v.labels.get("accent", "-")
        use_case = v.labels.get("use_case", "-")
        rows.append([v.name, v.category.upper(), gender.capitalize(), accent.capitalize(), use_case, v.description or ""])
    return rows

def get_history_table():
    hist = get_history_items(page_size=25)
    rows = []
    for item in hist:
        rows.append([
            item.voice_name,
            item.model_id,
            f"{item.duration_seconds:.2f}s",
            item.text[:60] + ("..." if len(item.text) > 60 else "")
        ])
    return rows or [["-", "-", "-", "No generation history yet"]]

# Build Gradio UI
initial_voices = get_voice_choices()

custom_css = """
/* Dark Obsidian Studio Styling */
body, .gradio-container {
    background-color: #080c14 !important;
    color: #f1f5f9 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
}
.studio-header {
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.2);
}
.accent-title {
    background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
}
.generate-btn {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.4) !important;
    transition: all 0.2s ease-in-out !important;
}
.generate-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px 0 rgba(124, 58, 237, 0.6) !important;
}
"""

with gr.Blocks(title="OpenLabs Studio - High-Fidelity Voice Synthesis") as demo:
    gr.HTML(f"<style>{custom_css}</style>")

    gr.HTML("""
    <div class="studio-header">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #9333ea); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); font-size: 22px;">🎙️</div>
          <div>
            <h1 class="accent-title" style="font-size: 26px; line-height: 1.2; margin: 0;">OpenLabs Studio</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">High-Fidelity Neural Speech Synthesis, Instant Voice Cloning & Acoustic DSP Workstation</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 12px; font-weight: 600;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399;"></span>
            ZeroGPU Engine Online
          </span>
          <span style="display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 9999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; font-size: 12px; font-weight: 600;">
            Free Tier Active
          </span>
        </div>
      </div>
    </div>
    """)

    with gr.Tabs():
        # TAB 1: SPEECH SYNTHESIS
        with gr.TabItem("🎙️ Speech Synthesis", id="tab_synth"):
            with gr.Row():
                with gr.Column(scale=3):
                    text_input = gr.Textbox(
                        label="Text Prompt",
                        placeholder="Type or paste any text to synthesize into natural, high-fidelity speech...",
                        lines=5,
                        value="Hello! OpenLabs is an independent, open-source neural voice synthesis engine. You can adjust stability, clarity, and style exaggeration in real time."
                    )
                    
                    with gr.Row():
                        voice_dropdown = gr.Dropdown(
                            label="Voice Character",
                            choices=initial_voices,
                            value=initial_voices[0] if initial_voices else None,
                            interactive=True,
                            scale=2
                        )
                        model_dropdown = gr.Dropdown(
                            label="Acoustic Model",
                            choices=[
                                "openlabs_multilingual_v2",
                                "openlabs_flash_v2_5",
                                "openlabs_turbo_v2",
                                "openlabs_neural_v1"
                            ],
                            value="openlabs_multilingual_v2",
                            interactive=True,
                            scale=2
                        )
                    
                    with gr.Accordion("🎚️ Advanced Voice Settings (DSP & Acoustics)", open=True):
                        with gr.Row():
                            stability_slider = gr.Slider(
                                minimum=0.0,
                                maximum=1.0,
                                value=0.50,
                                step=0.05,
                                label="Stability (Variance vs Consistency)",
                                info="Lower = dynamic prosodic variance. Higher = steady monotonic tone."
                            )
                            similarity_slider = gr.Slider(
                                minimum=0.0,
                                maximum=1.0,
                                value=0.75,
                                step=0.05,
                                label="Clarity / Similarity Boost",
                                info="Enhances reference timbre presence and spectral excitation."
                            )
                        with gr.Row():
                            style_slider = gr.Slider(
                                minimum=0.0,
                                maximum=1.0,
                                value=0.05,
                                step=0.05,
                                label="Style Exaggeration",
                                info="Non-linear dynamic expansion for dramatic emotional delivery."
                            )
                            speaker_boost_check = gr.Checkbox(
                                value=True,
                                label="Speaker Boost (Vocal Presence)",
                                info="Enables vocal shelf (+3.6dB @ 3.3kHz) and broadcast limiter."
                            )

                    generate_btn = gr.Button("✨ Generate Speech", elem_classes=["generate-btn"], size="lg")

                with gr.Column(scale=2):
                    audio_output = gr.Audio(label="Synthesized Audio Output", type="filepath", interactive=False)
                    status_output = gr.Textbox(label="Synthesis Diagnostics", interactive=False, lines=2)
                    
                    gr.Markdown("### Sample Test Prompts")
                    sample_btns = [
                        gr.Button("Podcast Intro", size="sm"),
                        gr.Button("Documentary Narration", size="sm"),
                        gr.Button("Urdu / Hindi Greeting", size="sm")
                    ]
                    
                    sample_btns[0].click(
                        fn=lambda: "Welcome back to the Deep Tech podcast. Today we are exploring the future of generative audio and open speech engines.",
                        inputs=[],
                        outputs=[text_input]
                    )
                    sample_btns[1].click(
                        fn=lambda: "Deep within the ancient mountains, a silent river has carved its path for millions of uninterrupted centuries.",
                        inputs=[],
                        outputs=[text_input]
                    )
                    sample_btns[2].click(
                        fn=lambda: "Aap sab ko OpenLabs mein khushamdeed! Yeh platform neural voice synthesis aur voice cloning free tier par chalata hai.",
                        inputs=[],
                        outputs=[text_input]
                    )

            generate_btn.click(
                fn=generate_speech,
                inputs=[
                    text_input,
                    voice_dropdown,
                    model_dropdown,
                    stability_slider,
                    similarity_slider,
                    style_slider,
                    speaker_boost_check
                ],
                outputs=[audio_output, status_output]
            )

        # TAB 2: VOICE LAB (CLONING)
        with gr.TabItem("🧬 Voice Lab (Instant Voice Cloning)", id="tab_clone"):
            gr.Markdown("### Instant Zero-Shot Voice Cloning\nUpload an audio sample (or record using your microphone) to extract vocal tract resonances, F0 pitch, and spectral identity.")
            with gr.Row():
                with gr.Column():
                    clone_name_input = gr.Textbox(label="Voice Name", placeholder="e.g. My Studio Voice")
                    clone_desc_input = gr.Textbox(label="Description (Optional)", placeholder="Conversational tone with warm low-end presence...")
                    clone_audio_input = gr.Audio(label="Reference Audio Sample (Upload or Record)", type="filepath")
                    clone_submit_btn = gr.Button("Clone Voice Instantly", elem_classes=["generate-btn"])
                with gr.Column():
                    clone_result_text = gr.Textbox(label="Cloning Results & Acoustic Profile", lines=8, interactive=False)
            
            clone_submit_btn.click(
                fn=clone_voice_handler,
                inputs=[clone_name_input, clone_audio_input, clone_desc_input],
                outputs=[clone_result_text, voice_dropdown]
            )

        # TAB 3: VOICE LIBRARY
        with gr.TabItem("📚 Voice Library", id="tab_library"):
            gr.Markdown("### Available Voice Profiles in OpenLabs")
            catalog_table = gr.Dataframe(
                headers=["Name", "Category", "Gender", "Accent", "Use Case", "Description"],
                value=get_voice_catalog_table(),
                interactive=False
            )
            refresh_catalog_btn = gr.Button("Refresh Catalog", size="sm")
            refresh_catalog_btn.click(fn=get_voice_catalog_table, inputs=[], outputs=[catalog_table])

        # TAB 4: GENERATION HISTORY
        with gr.TabItem("📜 History", id="tab_history"):
            gr.Markdown("### Recent Generation Log")
            history_table = gr.Dataframe(
                headers=["Voice", "Model", "Duration", "Prompt Preview"],
                value=get_history_table(),
                interactive=False
            )
            refresh_history_btn = gr.Button("Refresh History", size="sm")
            refresh_history_btn.click(fn=get_history_table, inputs=[], outputs=[history_table])

        # TAB 5: STANDALONE OBSIDIAN STUDIO PREVIEW
        if FRONTEND_INDEX.exists():
            with gr.TabItem("🎨 Obsidian UI Showcase", id="tab_showcase"):
                try:
                    index_html = FRONTEND_INDEX.read_text(encoding="utf-8")
                    escaped = html.escape(index_html)
                    gr.HTML(f"""
                    <div style="margin-bottom: 12px;">
                      <h3 style="color: #c084fc; margin-bottom: 4px;">Standalone Obsidian Dark UI Theme</h3>
                      <p style="color: #94a3b8; font-size: 13px;">Self-contained HTML5/CSS3 audio workstation interface with real-time audio canvas.</p>
                    </div>
                    <iframe srcdoc="{escaped}" style="width: 100%; height: 850px; border: 1px solid #334155; border-radius: 12px; background: #080c14;"></iframe>
                    """)
                except Exception as e:
                    gr.Markdown(f"Could not load standalone UI preview: {e}")

        # TAB 6: API DOCUMENTATION
        with gr.TabItem("💻 Developer API", id="tab_api"):
            gr.Markdown("""
### OpenLabs v1 REST API Reference

You can interact with the OpenLabs engine using Python SDK or standard cURL requests:

```python
import requests

url = "https://phantomdevel87-openlabs.hf.space/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"

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

#### cURL Example
```bash
curl -X POST "https://phantomdevel87-openlabs.hf.space/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \\
     -H "Content-Type: application/json" \\
     -d '{"text": "Hello world from OpenLabs", "model_id": "openlabs_multilingual_v2"}' \\
     --output speech.mp3
```
""")

# Register FastAPI v1 REST API endpoints on demo.app
for route in backend_fastapi_app.routes:
    if hasattr(route, "path") and (route.path.startswith("/v1") or route.path.startswith("/static")):
        demo.app.routes.insert(0, route)

# Launch the Gradio application
if __name__ == "__main__":
    demo.launch()
