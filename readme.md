# 🛡️ AEGIS — Agentic Immune System

> **A layered cybersecurity defense system that protects AI agents from indirect prompt injection attacks in the Agentic Web.**

---

## Project Description

AI agents that read emails, resumes, and web pages are vulnerable to **indirect prompt injection** — a class of attack where malicious instructions are hidden inside content to hijack agent behavior. AEGIS acts as an intelligent security middleware that intercepts, inspects, and governs every input and action before any damage can occur.

**What AEGIS prevents:** data leakage · unauthorized tool execution · fraudulent operations · policy bypass · agent hijacking

---

## How AEGIS Works

```
Untrusted Input → [Sanitizer] → Main Agent → [Governor] → Tool Execution → [Auditor] → Dashboard
```

Three specialized micro-agents form the defense pipeline:

- **🔍 Sanitizer** — Scans all inbound content *before* the agent reads it. Detects injections, Unicode tricks, hidden commands, and role-play overrides.
- **⚖️ Governor** — Intercepts every proposed tool call, enforces RBAC policies, calculates a **Blast Radius score (0–100)**, and blocks high-risk actions.
- **📋 Auditor** — Runs silently in the background, logging every event to an immutable SQLite database and streaming real-time alerts to the dashboard via WebSocket.

---

## Architecture Overview

| Layer | Technology | Purpose |
|---|---|---|
| Input Guard | Phi-3 Mini (Ollama) | Adversarial content classification |
| Orchestration | LangGraph | Multi-agent pipeline coordination |
| Policy Engine | Python + RBAC JSON | Deterministic action enforcement |
| Audit Store | SQLite (aiosqlite) | Immutable forensic event log |
| API Layer | FastAPI + WebSocket | Real-time backend communication |
| Dashboard | React 19 + Recharts | Live threat visualization |

---

## AI Tools Used

| Model / Framework | Role |
|---|---|
| **Microsoft Phi-3 Mini** (via Ollama) | Sanitizer — fast adversarial content detection |
| **Llama 3.1 8B** (via Ollama) | Main agent reasoning |
| **Mistral 7B** (via Ollama) | Governor — structured intent classification |
| **LangGraph** | Multi-agent orchestration and pipeline control |
| **LangChain Core / Community** | Agent tooling and prompt management |

> All models run **locally via Ollama** — no external API keys required.

---

## Setup Instructions

### Prerequisites
- Python 3.11+, Node.js 18+, [Ollama](https://ollama.com) installed

### 1 — Pull AI Models
```bash
ollama pull phi3:mini
ollama pull llama3.1:8b
ollama pull mistral:7b
```

### 2 — Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Configure as needed
python main.py                 # Runs on http://localhost:8001
```

### 3 — Frontend
```bash
cd frontend
npm install
npm run dev                    # Runs on http://localhost:5173
```

---

## Dependencies

**Backend (Python)**

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | ≥0.111.0 | REST API framework |
| `uvicorn[standard]` | ≥0.29.0 | ASGI server |
| `websockets` | ≥12.0 | Real-time WebSocket support |
| `langgraph` | ≥0.1.1 | Multi-agent orchestration |
| `langchain-core` | ≥0.3.0 | Agent and prompt tooling |
| `langchain-community` | ≥0.3.0 | Community integrations |
| `aiosqlite` | 0.20.0 | Async SQLite audit database |
| `pydantic` | ≥2.9.0 | Data validation and schemas |
| `httpx` | ≥0.27.0 | Async HTTP client |
| `reportlab` | 4.2.0 | PDF compliance report generation |
| `python-dotenv` | ≥1.0.1 | Environment configuration |

**Frontend (Node.js)**

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2 | UI framework |
| `vite` | ^8.0 | Build tool and dev server |
| `tailwindcss` | ^4.3 | Utility-first styling |
| `zustand` | ^5.0 | Lightweight state management |
| `socket.io-client` | ^4.8 | WebSocket real-time updates |
| `recharts` | ^3.8 | Security metrics visualization |
| `framer-motion` | ^12.4 | Animations and transitions |
| `react-router-dom` | ^7.17 | Client-side routing |
| `axios` | ^1.17 | HTTP API client |

**Runtime**

- [Ollama](https://ollama.com) — local LLM inference engine
- Python 3.11+
- Node.js 18+

---

## Team Details

<table style="width: 100%; border-collapse: collapse; text-align:center;">
    <tr>
        <th><a href="https://github.com/AnuragWaskle">Anurag Waskle</a></th>
        <th><a href="https://github.com/purvapatidar30-x">Purva</a></th>
    </tr>
    <tr>
        <td><img src="https://avatars.githubusercontent.com/AnuragWaskle" alt="Anurag Waskle"></td>
        <td><img src="https://avatars.githubusercontent.com/purvapatidar30-x" alt="Purva"></td>
    </tr>
</table>

---

*AEGIS — Making agentic AI trustworthy, one blocked injection at a time.*
