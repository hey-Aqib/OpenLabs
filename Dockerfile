FROM python:3.11-slim

WORKDIR /app

# Install system audio dependencies (ffmpeg, libsndfile1, espeak-ng for Linux TTS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    espeak-ng \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy full application code (including frontend and backend)
COPY . .

# Hugging Face Spaces listens on port 7860
EXPOSE 7860

# Start Uvicorn serving both the OpenLabs Studio UI and the v1 API
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]

