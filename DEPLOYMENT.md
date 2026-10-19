# ArchMoM: Production & Local Deployment Manual

This document provides exhaustive, step-by-step instructions for deploying and operating ArchMoM in air-gapped, privacy-preserving enterprise environments.

---

## 1. System Requirements & Hardware Sizing

| Workload Tier | RAM / VRAM | Recommended Local LLM | Speech-to-Text Model | Vision Model |
| :--- | :--- | :--- | :--- | :--- |
| **Lightweight (Laptop)** | 16 GB Unified / RAM | `llama3.1:8b-instruct-q4_K_M` | `faster-whisper` (medium, int8) | `qwen2.5-vl:7b` |
| **Architect Workstation** | 32 GB RAM + 16GB VRAM | `qwen2.5:14b-instruct-q5_K_M` | `faster-whisper` (large-v3, float16) | `qwen2.5-vl:14b` |
| **Enterprise Server** | 64+ GB RAM (NVIDIA A10/A100) | `qwen2.5:32b-instruct-q8_0` | `faster-whisper` (large-v3) | `qwen2.5-vl:32b` |

---

## 2. Option A: Native Host Deployment (Recommended for Local Dev)

### Prerequisites
- Python 3.10+
- Node.js v20+ / v22+
- FFmpeg (for audio chunking and media conversion):
  ```bash
  # macOS
  brew install ffmpeg

  # Ubuntu / Debian
  sudo apt-get update && sudo apt-get install -y ffmpeg
  ```

### Step 1: Install and Launch Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull qwen2.5:14b
ollama pull qwen2.5-vl

# Start Ollama daemon
ollama serve
```

### Step 2: Set Up Python Package
```bash
# Create virtualenv
python3 -m venv .venv
source .venv/bin/activate

# Install Python requirements
pip install -e ".[audio,vision,cli]"
```

### Step 3: Launch Full-Stack Web Studio
```bash
# Install Node dependencies
npm install

# Start fullstack dev server (Express backend + Vite frontend on port 3000)
npm run dev
```

### Step 4: Run Diagnostic Verification
```bash
python3 -m arch_mom.cli doctor
python3 -m unittest tests/test_pipeline.py -v
```

---

## 3. Option B: Docker Compose Deployment (Containerized)

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: arch_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_storage:/root/.ollama
    # Enable NVIDIA GPU if available:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]

  arch-mom:
    build: .
    container_name: arch_mom_app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:14b
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_storage:
```

### Build & Run
```bash
docker compose up -d --build
docker compose exec ollama ollama pull qwen2.5:14b
```

---

## 4. Option C: Systemd Service for Linux Workstations

Create `/etc/systemd/system/arch-mom.service`:
```ini
[Unit]
Description=ArchMoM Local Architecture Assistant
After=network.target ollama.service

[Service]
Type=simple
User=youruser
WorkingDirectory=/opt/arch-mom
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=OLLAMA_URL=http://127.0.0.1:11434
Environment=OLLAMA_MODEL=qwen2.5:14b

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now arch-mom
```

---

## 5. Security & Privacy Hardening

1. **Air-Gapped Operation**: The application does not require any outbound internet access. Ollama and faster-whisper run strictly on local CPU/GPU weights.
2. **Local Storage**: All file processing occurs in memory or in isolated temporary directories (`/tmp/`) with immediate unlinking upon completion.
3. **No Telemetry**: No third-party analytical scripts or telemetry beacons are injected into the client bundle.
