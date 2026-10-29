"""
OpenLabs Studio - Hugging Face Space Entrypoint
Serves the Full Obsidian Studio Web UI with ZeroGPU Free compatibility and REST endpoints.
"""
import os
from pathlib import Path
import gradio as gr
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app import app as backend_app

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_INDEX = BASE_DIR / "frontend" / "index.html"
CSS_PATH = BASE_DIR / "frontend" / "css" / "style.css"
JS_PATH = BASE_DIR / "frontend" / "js" / "app.js"

# 1. ZeroGPU Free Compatibility Check
try:
    import spaces
    HAS_ZEROGPU = True
except ImportError:
    HAS_ZEROGPU = False

if HAS_ZEROGPU:
    @spaces.GPU
    def zero_gpu_pipeline(x: str = "") -> str:
        """Satisfies Hugging Face ZeroGPU startup scanner."""
        return x
else:
    def zero_gpu_pipeline(x: str = "") -> str:
        return x

# 2. Build Gradio Interface embedding the Obsidian Studio UI in fullscreen
custom_css = """
body, html, .gradio-container, gradio-app {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    background-color: #080c14 !important;
}
footer { display: none !important; }
.contain { padding: 0 !important; }
"""

with gr.Blocks(title="OpenLabs Studio — High-Fidelity Voice Synthesis") as demo:
    # ZeroGPU hook component
    hidden_in = gr.Textbox(visible=False)
    hidden_out = gr.Textbox(visible=False)
    hidden_btn = gr.Button(visible=False)
    hidden_btn.click(fn=zero_gpu_pipeline, inputs=[hidden_in], outputs=[hidden_out])

    # Fullscreen Studio Embedding of the Obsidian Design
    gr.HTML(f"""
    <style>{custom_css}</style>
    <iframe src="/studio" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; z-index: 9999999; margin: 0; padding: 0; background-color: #080c14;"></iframe>
    """)

# 3. Mount Backend Routes directly onto demo.app
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route to serve the full Obsidian Studio UI
@demo.app.get("/studio")
async def serve_studio():
    return FileResponse(str(FRONTEND_INDEX), media_type="text/html")

@demo.app.get("/static/css/style.css")
async def serve_css():
    return FileResponse(str(CSS_PATH), media_type="text/css")

@demo.app.get("/static/js/app.js")
async def serve_js():
    return FileResponse(str(JS_PATH), media_type="application/javascript")

# Mount all /v1 endpoints from backend_app directly on demo.app
demo.app.routes.extend([
    r for r in backend_app.routes 
    if hasattr(r, 'path') and r.path.startswith('/v1')
])

if __name__ == "__main__":
    demo.launch()
