# Multi-Agent AI Platform

A full-stack web app where three AI agents collaborate to solve coding tasks — live, in your browser.

You type a task. A research agent plans it. A coding agent writes it. A review agent critiques it. You watch all three work in real time.

**Live demo → [multi-agent-platform-rho.vercel.app](https://multi-agent-platform-rho.vercel.app)**  
**API docs → [multi-agent-platform-api.onrender.com/docs](https://multi-agent-platform-api.onrender.com/docs)**

---

## Why I built this

I wanted to build something that actually demonstrates full-stack skills end-to-end — not just a todo app or a weather widget. Multi-agent AI systems are genuinely how AI is being deployed in production right now, and I wanted to understand how they work by building one from scratch.

The hardest part was figuring out how to stream live agent updates to the browser without blocking the server. The agents make synchronous calls to the AI API, but the WebSocket handler is async — getting that threading bridge working correctly took real problem-solving.

---

## What it does

Submit any coding or research task and watch three specialized agents work through it:

- **Research Agent** — breaks down the task, identifies what's needed, creates a structured plan
- **Coding Agent** — takes that plan and writes actual working code with explanations
- **Review Agent** — reads the code, checks for bugs and improvements, gives a final verdict

Every run is saved. You can browse the full history, see each agent's individual output, and track platform usage on the analytics page.

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 + TypeScript | File-based routing, type safety, Vercel-native |
| Styling | Tailwind CSS | Fast, consistent, no CSS file juggling |
| Backend | FastAPI (Python) | Async-native, auto-generates API docs, WebSocket support |
| AI Agents | LangGraph + LangChain | Graph-based orchestration with shared state between agents |
| AI Model | Groq — Llama 3.3 70B | Free tier, significantly faster than OpenAI, comparable quality |
| Database | SQLite | Zero config, perfect for this scale |
| Real-time | WebSockets | Server pushes agent updates live — no polling |
| Deployment | Vercel (frontend) + Render (backend) | Both free tier, auto-deploy on push |

---

## Architecture

```
User submits task
      ↓
Next.js frontend opens WebSocket to FastAPI backend
      ↓
Backend saves run to SQLite → starts LangGraph pipeline in background thread
      ↓
Research Agent runs → callback fires → WebSocket message sent to browser
      ↓
Coding Agent runs → callback fires → WebSocket message sent to browser
      ↓
Review Agent runs → callback fires → WebSocket message sent to browser
      ↓
All outputs saved to DB → final "completed" message sent
      ↓
Frontend updates agent cards in real time without page refresh
```

The interesting technical challenge here is the threading. LangGraph runs synchronously (blocking), but the FastAPI WebSocket handler is async. Running blocking code directly in an async function would freeze the entire server. The solution is a `queue.Queue()` as a thread-safe bridge — the agent thread puts updates in, the async handler reads them out and sends them over WebSocket.

---

## Pages

**Dashboard (`/`)** — Submit a task, watch agents work live, see recent run history in the sidebar

**History (`/history`)** — Table of all past runs with status badges and timestamps, click any row for full detail

**Run detail (`/runs/[id]`)** — Full output from each agent in collapsible sections

**Analytics (`/analytics`)** — Runs per day bar chart, success rate, status breakdown

---

## Running locally

You'll need Python 3.13+ and Node.js 18+.

**Backend**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_key_here
```

Get a free Groq API key at [console.groq.com](https://console.groq.com)

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000` — visit `/docs` for the interactive API explorer.

**Frontend**

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Project structure

```
multi-agent-platform/
├── backend/
│   ├── main.py          # FastAPI app, all routes, WebSocket handler
│   ├── agents.py        # 3 agent functions + LangGraph pipeline
│   ├── database.py      # SQLite setup, runs + agent_logs tables
│   ├── models.py        # Pydantic request/response models
│   └── requirements.txt
│
└── frontend/
    └── app/
        ├── page.tsx              # Dashboard — task input, live agent cards
        ├── layout.tsx            # Shared navbar + layout
        ├── api.ts                # API + WebSocket helper functions
        ├── types.ts              # TypeScript interfaces
        ├── history/page.tsx      # Run history table
        ├── analytics/page.tsx    # Charts and stats
        └── runs/[id]/page.tsx    # Individual run detail
```

---

## API routes

| Method | Route | What it does |
|--------|-------|-------------|
| GET | `/` | Health check |
| POST | `/run` | Submit task, run all 3 agents, return results |
| GET | `/runs` | List all past runs |
| GET | `/runs/{id}` | Get one run with all agent logs |
| WS | `/ws/run` | Submit task and stream live agent updates |

---

## What I learned building this

Before this project I had never worked with WebSockets, multi-agent systems, or deployed a full-stack app end to end. A few things that genuinely surprised me:

**Threading in async Python is non-obvious.** You can't just call a blocking function from an async handler — it freezes everything. Understanding why and solving it with a thread + queue taught me more about concurrency than any tutorial.

**LangGraph changes how you think about pipelines.** Once I stopped thinking of the agents as "three function calls" and started thinking of them as nodes in a graph with shared state, the architecture became much cleaner and easier to extend.

**Deployment is where real problems hide.** The code that worked locally had CORS issues, wrong WebSocket URLs (ws vs wss), and a secret key accidentally committed to git. Debugging deployment issues taught me to think about the difference between local and production environments much more carefully.

---

## Possible extensions

- Add a 4th Testing Agent that actually runs the generated code and returns pass/fail
- Swap SQLite for PostgreSQL for multi-user support
- Add authentication so users can have personal run history
- Stream token-by-token output (true streaming) instead of per-agent updates
- Let users choose which agents to include in the pipeline

---

Built with FastAPI, LangGraph, Next.js, and Groq. Deployed on Render + Vercel.
