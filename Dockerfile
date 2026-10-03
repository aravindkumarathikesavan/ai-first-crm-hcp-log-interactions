# Multi-stage build: Frontend + Backend in one container
# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 into frontend/build
COPY --from=frontend-builder /app/frontend/build ./frontend/build

WORKDIR /app/backend

# Default environment variables for production / Render
ENV PORT=8000
ENV GROQ_API_KEY=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
ENV GROQ_PRIMARY_MODEL=openai/gpt-oss-20b
ENV GROQ_CONTEXT_MODEL=openai/gpt-oss-120b
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
