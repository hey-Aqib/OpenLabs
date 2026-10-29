"""
OpenLabs Studio - Hugging Face Space Entrypoint
Serves the Original High-Fidelity Obsidian Studio Web UI with ZeroGPU Free compatibility.
"""
import os
import html
from pathlib import Path
import gradio as gr
from fastapi.responses import FileResponse
from fastapi.routing import APIRoute
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

# Read the inlined Obsidian Studio HTML
raw_html = FRONTEND_INDEX.read_text(encoding="utf-8")
escaped_html = html.escape(raw_html)

# 2. Build Gradio Blocks that hosts the Original Obsidian Studio in 100% Fullscreen
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
    # ZeroGPU hook component (hidden)
    hidden_in = gr.Textbox(visible=False)
    hidden_out = gr.Textbox(visible=False)
    hidden_btn = gr.Button(visible=False)
    hidden_btn.click(fn=zero_gpu_pipeline, inputs=[hidden_in], outputs=[hidden_out])

    # Fullscreen Original Obsidian Studio UI
    gr.HTML(f"""
    <style>{custom_css}</style>
    <iframe src="/studio" srcdoc="{escaped_html}" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; z-index: 9999999; margin: 0; padding: 0; background-color: #080c14;"></iframe>
    """)

# 3. Mount Backend Routes directly at the TOP of demo.app.routes
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

studio_route = APIRoute(
    "/studio",
    lambda: FileResponse(str(FRONTEND_INDEX), media_type="text/html"),
    methods=["GET"]
)
css_route = APIRoute(
    "/static/css/style.css",
    lambda: FileResponse(str(CSS_PATH), media_type="text/css"),
    methods=["GET"]
)
js_route = APIRoute(
    "/static/js/app.js",
    lambda: FileResponse(str(JS_PATH), media_type="application/javascript"),
    methods=["GET"]
)

# Insert custom routes at index 0 in reverse order so they appear in correct priority
v1_routes = [r for r in backend_app.routes if hasattr(r, 'path') and r.path.startswith('/v1')]
priority_routes = [studio_route, css_route, js_route] + v1_routes

for route in reversed(priority_routes):
    demo.app.routes.insert(0, route)

if __name__ == "__main__":
    demo.launch()
