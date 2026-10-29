"""
OpenLabs Studio - Hugging Face Gradio Space Entrypoint
Mounts the OpenLabs Speech Engine and serves the full Studio UI.
"""
import os
import gradio as gr
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app import app

# Ensure frontend static directory is mounted
try:
    app.mount("/static", StaticFiles(directory="frontend"), name="static")
except Exception:
    pass

@app.get("/studio")
async def serve_studio_ui():
    return FileResponse("frontend/index.html")

# Create a clean fullscreen Gradio wrapper embedding our Studio UI
with gr.Blocks(title="OpenLabs Studio", css="""
    body, .gradio-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; background-color: #080c14 !important; }
    footer { display: none !important; }
""") as demo:
    gr.HTML("""
    <iframe src="/studio" style="width: 100vw; height: 100vh; border: none; margin: 0; padding: 0; display: block;"></iframe>
    """)

# Mount Gradio onto the existing FastAPI application
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    demo.launch()
