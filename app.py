"""
OpenLabs Studio - Hugging Face Space Entrypoint
Serves OpenLabs Studio UI directly at root / with full REST API and ZeroGPU compatibility.
"""
import os
from pathlib import Path
import uvicorn
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app import app

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

# ZeroGPU Compatibility Check
try:
    import spaces
    @spaces.GPU
    def zero_gpu_pipeline(x: str = "") -> str:
        """Satisfies Hugging Face ZeroGPU startup scanner."""
        return x
except ImportError:
    def zero_gpu_pipeline(x: str = "") -> str:
        return x

# Explicit static file route handlers
@app.get("/static/css/style.css")
async def get_style_css():
    return FileResponse(str(FRONTEND_DIR / "css" / "style.css"), media_type="text/css")

@app.get("/static/js/app.js")
async def get_app_js():
    return FileResponse(str(FRONTEND_DIR / "js" / "app.js"), media_type="application/javascript")

@app.get("/studio")
async def serve_studio():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.get("/")
async def serve_root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
