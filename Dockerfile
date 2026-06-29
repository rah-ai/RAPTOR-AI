# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# We use vite build directly to skip strict TS checking (as configured in package.json)
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.11-slim AS backend
WORKDIR /app/backend

# Install system dependencies (required for some ML libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy the built React frontend from Stage 1 into the backend's dist folder
COPY --from=frontend-builder /app/frontend/dist ./dist

# Ensure the ML model is trained/exists.
# (If raptor_model.joblib is already in GitHub, this won't do much,
# but it ensures the model is generated if missing).
RUN python -m app.ml.train

# Expose the port (Koyeb and HF Spaces usually route to 8000 or 7860, but read from PORT env)
ENV PORT=8000
EXPOSE 8000

# Start the FastAPI unified server
CMD ["python", "run.py"]
