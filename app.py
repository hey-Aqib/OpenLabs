"""
OpenLabs Studio - Hugging Face Gradio Space Entrypoint
Mounts the OpenLabs Speech Engine and serves the full Studio UI with ZeroGPU / CPU compatibility.
"""
import os
import gradio as gr
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app import app

# ZeroGPU Compatibility Check
try:
    import spaces
except ImportError:
    spaces = None

if spaces is not None:
    @spaces.GPU
    def zero_gpu_pipeline(x: str = "") -> str:
        """Satisfies Hugging Face ZeroGPU startup scanner."""
        return x
else:
    def zero_gpu_pipeline(x: str = "") -> str:
        return x

# Ensure frontend static directory is mounted
try:
    app.mount("/static", StaticFiles(directory="frontend"), name="static")
except Exception:
    pass

@app.get("/studio")
async def serve_studio_ui():
    return FileResponse("frontend/index.html")

# Gradio Block with ZeroGPU hook & fullscreen Studio UI
with gr.Blocks(title="OpenLabs Studio") as demo:
    # ZeroGPU hook component (hidden)
    hidden_in = gr.Textbox(visible=False)
    hidden_out = gr.Textbox(visible=False)
    hidden_btn = gr.Button(visible=False)
    hidden_btn.click(fn=zero_gpu_pipeline, inputs=[hidden_in], outputs=[hidden_out])

    # Fullscreen Studio Embedding
    gr.HTML("""
    <style>
      body, html, .gradio-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        height: 100vh !important;
        overflow: hidden !important;
        background-color: #080c14 !important;
      }
      footer { display: none !important; }
    </style>
    <iframe src="/studio" style="width: 100vw; height: 100vh; border: none; margin: 0; padding: 0; display: block; position: fixed; top: 0; left: 0; z-index: 99999;"></iframe>
    """)

# Mount Gradio onto the existing FastAPI application
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    demo.launch()
