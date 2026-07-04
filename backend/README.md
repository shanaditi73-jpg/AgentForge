# Multi-Agent AI Platform — Backend

A FastAPI backend with 3 AI agents orchestrated via LangGraph.

## Tech Stack
- Python + FastAPI
- LangGraph (agent orchestration)
- Groq (free AI inference)
- SQLite (database)

## Setup
1. Create and activate virtual environment
2. Run `pip install -r requirements.txt`
3. Add your `GROQ_API_KEY` to `.env`
4. Run `uvicorn main:app --reload`

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Health check |
| POST | `/run` | Submit a task, run all 3 agents |
| GET | `/runs` | List all past runs |
| GET | `/runs/{id}` | Get detail + agent logs for one run |
| WS | `/ws/run` | Submit task and get live agent updates |

## Agents
1. **Research Agent** — Plans and breaks down the task
2. **Coding Agent** — Writes the solution based on the plan
3. **Review Agent** — Reviews and critiques the solution
