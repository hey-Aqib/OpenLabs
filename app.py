"""
OpenLabs Studio - Hugging Face Spaces & Standalone Entrypoint
Mounts the OpenLabs FastAPI application and Gradio interface for 100% free hosting.
"""
import os
import uvicorn
from backend.app import app

try:
    import gradio as gr
    
    with gr.Blocks(title="OpenLabs Studio") as demo:
        gr.HTML("""
        <div style="text-align: center; padding: 40px; font-family: sans-serif;">
            <h1 style="color: #6366f1;">🎙️ OpenLabs Studio is Running!</h1>
            <p>The high-fidelity voice synthesis studio is active.</p>
            <a href="/" target="_blank" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Launch Full Studio UI</a>
        </div>
        """)
        
    app = gr.mount_gradio_app(app, demo, path="/gradio")
except Exception as e:
    print(f"Gradio mounting notice: {e}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
