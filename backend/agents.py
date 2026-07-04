from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import os

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        api_key=os.getenv("GROQ_API_KEY")
    )

# ─────────────────────────────────────────────
# Agent 1: Research Agent
# ─────────────────────────────────────────────
def research_agent(task: str) -> str:
    llm = get_llm()
    messages = [
        SystemMessage(content="""You are a research agent. 
        Your job is to analyze a task, break it down into clear steps, 
        and identify what information or resources are needed.
        Be concise and structured."""),
        HumanMessage(content=f"Research and plan this task: {task}")
    ]
    response = llm.invoke(messages)
    return response.content

# ─────────────────────────────────────────────
# Agent 2: Coding Agent
# ─────────────────────────────────────────────
def coding_agent(task: str, research_output: str) -> str:
    llm = get_llm()
    messages = [
        SystemMessage(content="""You are a coding agent.
        Given a task and a research plan, write clean, working code or 
        a detailed technical solution. Include comments explaining key parts."""),
        HumanMessage(content=f"""
Task: {task}

Research plan:
{research_output}

Now write the code or technical solution:
        """)
    ]
    response = llm.invoke(messages)
    return response.content

# ─────────────────────────────────────────────
# Agent 3: Review Agent
# ─────────────────────────────────────────────
def review_agent(task: str, code_output: str) -> str:
    llm = get_llm()
    messages = [
        SystemMessage(content="""You are a code review agent.
        Review the provided solution for correctness, quality, and best practices.
        Point out any bugs, improvements, or missing edge cases.
        End with a summary verdict: APPROVED or NEEDS REVISION."""),
        HumanMessage(content=f"""
Original task: {task}

Solution to review:
{code_output}

Provide your review:
        """)
    ]
    response = llm.invoke(messages)
    return response.content

# ─────────────────────────────────────────────
# LangGraph orchestration with callback support
# ─────────────────────────────────────────────
from langgraph.graph import StateGraph, END
from typing import TypedDict, Callable, Optional

class AgentState(TypedDict):
    task: str
    research_output: str
    coding_output: str
    review_output: str

def build_agent_graph(callback: Optional[Callable] = None):
    """
    callback is a function we call after each agent finishes.
    This lets us send WebSocket updates in real time.
    """

    def run_research(state: AgentState) -> AgentState:
        if callback:
            callback("research", "started", "")
        output = research_agent(state["task"])
        if callback:
            callback("research", "completed", output)
        return {**state, "research_output": output}

    def run_coding(state: AgentState) -> AgentState:
        if callback:
            callback("coding", "started", "")
        output = coding_agent(state["task"], state["research_output"])
        if callback:
            callback("coding", "completed", output)
        return {**state, "coding_output": output}

    def run_review(state: AgentState) -> AgentState:
        if callback:
            callback("review", "started", "")
        output = review_agent(state["task"], state["coding_output"])
        if callback:
            callback("review", "completed", output)
        return {**state, "review_output": output}

    graph = StateGraph(AgentState)
    graph.add_node("research", run_research)
    graph.add_node("coding", run_coding)
    graph.add_node("review", run_review)
    graph.set_entry_point("research")
    graph.add_edge("research", "coding")
    graph.add_edge("coding", "review")
    graph.add_edge("review", END)

    return graph.compile()

def run_pipeline(task: str, callback: Optional[Callable] = None) -> dict:
    graph = build_agent_graph(callback=callback)
    initial_state: AgentState = {
        "task": task,
        "research_output": "",
        "coding_output": "",
        "review_output": ""
    }
    result = graph.invoke(initial_state)
    return result
    