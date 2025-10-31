FROM python:3.12-slim

# System packages required by OpenCV/Ultralytics and video handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# App root
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code (includes model file if present in backend/)
COPY backend /app/backend
# Copy model from project root into backend image to avoid runtime download
COPY yolov8n-pose.pt /app/backend/yolov8n-pose.pt

# Default port for Spaces; platform will inject PORT
ENV PORT=7860

# Work in backend directory and expose port
WORKDIR /app/backend
EXPOSE 7860

# Start FastAPI via uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]