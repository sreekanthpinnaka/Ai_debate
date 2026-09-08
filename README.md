# AI Debate Simulator ⚖️

[![CI](https://github.com/your-username/ai-debate-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ai-debate-simulator/actions/workflows/ci.yml)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.2+-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent multi-agent debate platform where independent LLMs clash in structured Oxford-style debates across three rounds (**Opening**, **Rebuttal**, and **Closing**). Arguments are evaluated by an impartial AI Judge across five validated scoring rubrics, visualized with comparative 5-axis radar charts, narrated with browser text-to-speech, and benchmarked with an interactive audience prediction challenge.

---

## 📸 Overview

```text
                               ┌───────────────────────────┐
                               │   Debate Proposition      │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             ┌───────────────────┐                       ┌───────────────────┐
             │   🛡️ PRO Agent     │                       │   ⚔️ CON Agent     │
             │ (e.g. gpt-4o)     │                       │ (e.g. o3-mini)    │
             └─────────┬─────────┘                       └─────────┬─────────┘
                       │                                           │
                       │   Round 1: Opening Arguments              │
                       │   Round 2: Rebuttal & Cross-Examination   │
                       │   Round 3: Closing Arguments              │
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │     ⚖️ AI Judge Agent     │
                               │  (e.g. chatgpt-4o-latest) │
                               └─────────────┬─────────────┘
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         ▼                                   ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐                ┌──────────────────┐
│  5-Axis Radar    │               │ Audience Verdict │                │  Audio Podcast   │
│  Scorecards      │               │ Prediction Game  │                │  Narration Mode  │
└──────────────────┘               └──────────────────┘                └──────────────────┘
```

---

## ✨ Key Features

### 🧠 Multi-Model Faceoffs & Dynamic Rematches
* **Independent Model Selection**: Assign different models independently to **PRO**, **CON**, and the **Judge** (e.g., pit `gpt-4o` against `o3-mini`, or `o1-mini` against `gpt-4o-mini`).
* **Deep Reasoning Compatibility**: First-class support for reasoning models (`o3-mini`, `o1-mini`, `o1`) with dynamic parameter adaptation (developer role instructions and temperature omission).
* **Quick Faceoff Presets**: One-click matchup chips including *Flagship vs. Mini*, *Reasoning Clash*, and *Deep Deduction*.
* **On-Page Rematch Drawer**: Swap sides or change models directly on a completed debate to run an instant rematch on the exact same proposition.

### ⚡ Real-Time Streaming & User-Paced Reading
* **Token-by-Token Streaming**: Watch debaters compose their arguments simultaneously in real time via Server-Sent Events (SSE).
* **User-Controlled Verdict Reveal**: The live debate screen gives you unlimited time to read and digest the arguments. The judge's decision is sealed until you explicitly click **Reveal Judge's Verdict**.

### 📊 Impartial AI Judge & 5-Axis Radar Chart
* **Strict Five-Rubric Evaluation**:
  1. *Argument Quality*
  2. *Logical Consistency*
  3. *Rebuttal Quality*
  4. *Clarity*
  5. *Persuasiveness*
* **Comparative Radar Chart**: Interactive spider chart contrasting PRO (emerald) vs. CON (amber) performance.
* **Bias Mitigation**: Impartial judge prompts minimize affirmative/positional bias and identify explicit fallacies and unaddressed arguments.

### 🎯 Interactive Audience Prediction Challenge
* **Predict the Winner**: Vote `🛡️ PRO`, `⚔️ CON`, or `⚖️ TIE` after Round 3.
* **Comparison Verdict Card**:
  * **🎯 Spot-on Prediction**: Celebrates calling the winner right, displaying the total margin of victory (`+X.X pts`) and the **Decisive Rubric Edge** that drove the win.
  * **⚖️ Split Decision**: Contrasts your perspective with the Judge's scorecard to reveal where the winning debater gained the upper hand.
* **Debate History & Career Record**: Tracks your lifetime prediction accuracy, total wins, and analyst badges (🏆 *Master Adjudicator*, 🎯 *Sharp Analyst*, ⚖️ *Balanced Observer*).

### 🎙️ Audio Narration / Podcast Mode
* Built-in browser text-to-speech player utilizing the Web Speech API.
* Distinct audio pitch and rate tuning for the **Announcer**, **PRO**, **CON**, and **Judge** speakers.

### 📁 Export & Persistence
* **Debate History**: Fully persistent client-side storage (`localStorage`) with a searchable history modal.
* **Markdown Export**: Download formatted `.md` summaries complete with metadata, scores, and round-by-round transcripts.
* **One-Click Clipboard Copy**: Share concise debate results instantly.

### 🛡️ Layered Safety Guardrails
* Topic length and semantic quality gatekeepers.
* Prompt-injection detection and untrusted input isolation.
* Semantic content moderation filter.

---

## 🛠️ Technology Stack

| Area | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite / Vinext, Tailwind CSS v4, Lucide Icons, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, HTTPX |
| **AI / LLM** | OpenAI API (`gpt-4o`, `o3-mini`, `o1-mini`, `o1`, etc.) or OpenAI-compatible endpoints |
| **Testing & CI** | Pytest, Pytest-asyncio, Oxlint, GitHub Actions |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.11+** installed
* **Node.js 22+** and `npm` installed
* An **OpenAI API Key**

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-debate-simulator.git
cd ai-debate-simulator
```

---

### 2. Configure Environment Variables

#### Backend Configuration:
```bash
# Copy the example file
cp backend/.env.example backend/.env
```
*(On Windows PowerShell: `Copy-Item backend/.env.example backend/.env`)*

Edit `backend/.env` and insert your OpenAI API key:
```ini
OPENAI_API_KEY=sk-...your-key-here...
```

#### Frontend Configuration (Optional):
```bash
cp frontend/.env.example frontend/.env
```
*(By default, the frontend connects to `http://localhost:8000`)*

---

### 3. Start the Backend

From the repository root:

```bash
cd backend
python -m venv venv

# Activate virtual environment:
# macOS/Linux:
source venv/bin/activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies:
pip install -r requirements.txt

# Start FastAPI server:
uvicorn app.main:app --reload --port 8000
```

* API Docs (Swagger): `http://localhost:8000/docs`
* Health Endpoint: `http://localhost:8000/api/health`

---

### 4. Start the Frontend

In a separate terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at the URL printed by Vite (typically `http://localhost:8787` or `http://localhost:5173`).

---

## 🐳 Docker Setup

You can run both the frontend and backend using Docker Compose:

```bash
# Set your API key in your environment
export OPENAI_API_KEY="your-key-here"

# Build and start services
docker-compose up --build
```

Access the application at `http://localhost:5173`.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | *(None)* | **Required**: OpenAI API key |
| `OPENAI_BASE_URL` | *(None)* | Optional custom endpoint (for Ollama, Groq, OpenRouter, vLLM) |
| `MODEL_NAME` | `gpt-4o-mini` | Default baseline LLM model |
| `MODEL_TEMPERATURE` | `0.7` | Debater temperature (creativity) |
| `JUDGE_TEMPERATURE` | `0.2` | Judge temperature (consistency) |
| `MODEL_TIMEOUT_SECONDS` | `60` | Per-request timeout in seconds |
| `ENABLE_MODERATION` | `true` | Enables semantic content moderation |
| `ENABLE_TOPIC_REVIEW` | `true` | Enables AI topic eligibility check |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `CORS_ORIGINS` | *(None)* | Comma-separated additional allowed origins |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | URL of the FastAPI backend |
| `SITE_URL` | `http://localhost:8787` | Site origin for social cards & metadata |

---

## 📡 API Reference

### `GET /api/models`
Returns list of available model presets configured for debaters and judge.

```json
{
  "default_model": "gpt-4o-mini",
  "presets": [
    { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast, high-quality default" },
    { "id": "gpt-4o", "name": "GPT-4o", "description": "Flagship multi-modal intelligence" },
    { "id": "o3-mini", "name": "o3-mini", "description": "Advanced logical depth" },
    { "id": "o1-mini", "name": "o1-mini", "description": "Analytical reasoning" }
  ]
}
```

### `POST /api/debates/stream`
Streams the 3-round debate and judge evaluation via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "topic": "Should artificial intelligence development be regulated by an international treaty?",
  "pro_model": "gpt-4o",
  "con_model": "o3-mini",
  "judge_model": "gpt-4o"
}
```

**SSE Event Types:**
* `debate_started`: Initial topic & model validation
* `round_started`: New debate round initiated (1: Opening, 2: Rebuttal, 3: Closing)
* `agent_started`: Debater agent initiated
* `agent_chunk`: Real-time streaming delta token
* `agent_completed`: Full round text finalized
* `judge_started`: Judge evaluating transcript against 5 rubrics
* `judge_completed`: Final verdict, rubric scores, and fallacy analysis
* `debate_completed`: Complete debate payload ready

---

## 🧪 Testing & Verification

### Backend Tests
```bash
cd backend
pytest -q
```
* Runs 24 comprehensive unit and integration tests covering role prompt isolation, scoring calculations, SSE streaming queues, and error translation.

### Frontend Lint & Production Build
```bash
cd frontend
npm run lint    # Oxlint (0 errors)
npm run build   # Production bundle verification
```

---

## 📤 Pushing to Your GitHub Repository

When you are ready to push this codebase to GitHub:

```bash
# 1. Initialize git repository
git init

# 2. Add all files (the updated .gitignore protects your .env and secrets)
git add .

# 3. Create your initial commit
git commit -m "feat: complete AI Debate Simulator with multi-model faceoffs, streaming, radar charts, and prediction game"

# 4. Set main branch
git branch -M main

# 5. Connect your remote repository
git remote add origin https://github.com/<your-github-username>/<your-repo-name>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
