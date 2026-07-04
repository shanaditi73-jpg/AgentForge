from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio
import json
import os

from database import init_db, get_connection
from models import TaskRequest
from agents import run_pipeline

load_dotenv()

app = FastAPI(
    title="Multi-Agent AI Platform",
    description="3 AI agents: Research, Coding, and Review",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
    print("Server started. Database ready.")

# ─────────────────────────────────────────────
# Route 1: Health check
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Multi-Agent AI Platform is running!"}

# ─────────────────────────────────────────────
# Route 2: POST /run — standard (non-streaming)
# ─────────────────────────────────────────────
@app.post("/run")
def run_task(request: TaskRequest):
    conn = get_connection()
    cursor = conn.cursor()
    run_id = None

    try:
        cursor.execute(
            "INSERT INTO runs (task, status) VALUES (?, ?)",
            (request.task, "running")
        )
        conn.commit()
        run_id = cursor.lastrowid

        result = run_pipeline(request.task)

        for agent_name, field in [
            ("research", "research_output"),
            ("coding",   "coding_output"),
            ("review",   "review_output"),
        ]:
            cursor.execute(
                "INSERT INTO agent_logs (run_id, agent_name, output) VALUES (?, ?, ?)",
                (run_id, agent_name, result[field])
            )

        cursor.execute(
            "UPDATE runs SET status=?, result=? WHERE id=?",
            ("completed", result["review_output"], run_id)
        )
        conn.commit()

        return {
            "run_id": run_id,
            "status": "completed",
            "research": result["research_output"],
            "coding":   result["coding_output"],
            "review":   result["review_output"]
        }

    except Exception as e:
        if run_id:
            cursor.execute(
                "UPDATE runs SET status=? WHERE id=?",
                ("failed", run_id)
            )
            conn.commit()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        conn.close()

# ─────────────────────────────────────────────
# Route 3: GET /runs — list all past runs
# ─────────────────────────────────────────────
@app.get("/runs")
def get_runs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ─────────────────────────────────────────────
# Route 4: GET /runs/{id} — detail of one run
# ─────────────────────────────────────────────
@app.get("/runs/{run_id}")
def get_run(run_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM runs WHERE id=?", (run_id,))
    run = cursor.fetchone()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    cursor.execute("SELECT * FROM agent_logs WHERE run_id=?", (run_id,))
    logs = cursor.fetchall()
    conn.close()

    return {
        **dict(run),
        "agent_logs": [dict(log) for log in logs]
    }

# ─────────────────────────────────────────────
# Route 5: WebSocket /ws/run — live streaming
# ─────────────────────────────────────────────
@app.websocket("/ws/run")
async def websocket_run(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        payload = json.loads(data)
        task = payload.get("task", "")

        if not task:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "No task provided"
            }))
            return

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO runs (task, status) VALUES (?, ?)",
            (task, "running")
        )
        conn.commit()
        run_id = cursor.lastrowid

        await websocket.send_text(json.dumps({
            "type": "started",
            "run_id": run_id,
            "message": f"Starting agents for task: {task}"
        }))

        # Use a queue to safely pass updates from the thread to async
        import queue
        update_queue = queue.Queue()

        def on_agent_update(agent_name: str, status: str, output: str):
            update_queue.put({
                "type": "agent_update",
                "agent": agent_name,
                "status": status,
                "output": output
            })

        # Run pipeline in background thread
        import threading
        result_container = {}
        error_container = {}

        def run_in_thread():
            try:
                result_container["result"] = run_pipeline(task, callback=on_agent_update)
            except Exception as e:
                error_container["error"] = str(e)
            finally:
                update_queue.put(None)  # Signal done

        thread = threading.Thread(target=run_in_thread)
        thread.start()

        # Stream updates as they arrive
        while True:
            try:
                update = update_queue.get(timeout=0.1)
                if update is None:
                    break
                await websocket.send_text(json.dumps(update))
            except:
                await asyncio.sleep(0.1)

        thread.join()

        if "error" in error_container:
            raise Exception(error_container["error"])

        result = result_container["result"]

        for agent_name, field in [
            ("research", "research_output"),
            ("coding",   "coding_output"),
            ("review",   "review_output"),
        ]:
            cursor.execute(
                "INSERT INTO agent_logs (run_id, agent_name, output) VALUES (?, ?, ?)",
                (run_id, agent_name, result[field])
            )

        cursor.execute(
            "UPDATE runs SET status=?, result=? WHERE id=?",
            ("completed", result["review_output"], run_id)
        )
        conn.commit()
        conn.close()

        await websocket.send_text(json.dumps({
            "type": "completed",
            "run_id": run_id,
            "research": result["research_output"],
            "coding":   result["coding_output"],
            "review":   result["review_output"]
        }))

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": str(e)
        }))
        