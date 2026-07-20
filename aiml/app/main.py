"""
FlowForge AIML — Natural language → workflow JSON (rule-based scaffold; swap LLM later).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import uuid

app = FastAPI(title="FlowForge AIML", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class NLRequest(BaseModel):
    prompt: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "flowforge-aiml"}


@app.post("/nl-to-workflow")
def nl_to_workflow(body: NLRequest):
    text = body.prompt.lower()
    nodes = []
    trigger = {
        "id": "trigger",
        "type": "trigger",
        "label": "Webhook" if "webhook" in text else "Manual",
        "config": {},
        "next": [],
    }
    nodes.append(trigger)
    prev = "trigger"

    if "email" in text or "mail" in text:
        nid = "email1"
        to = "user@example.com"
        m = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", body.prompt)
        if m:
            to = m.group(0)
        nodes.append(
            {
                "id": nid,
                "type": "email",
                "label": f"Email {to}",
                "config": {"to": to, "subject": "FlowForge notification"},
                "next": [],
            }
        )
        nodes[-2]["next"] = [nid]
        prev = nid

    if "http" in text or "api" in text or "post" in text or "get" in text:
        nid = "http1"
        url = "https://httpbin.org/post"
        m = re.search(r"https?://\S+", body.prompt)
        if m:
            url = m.group(0).rstrip(".,)")
        method = "POST" if "post" in text else "GET"
        nodes.append(
            {
                "id": nid,
                "type": "http",
                "label": f"{method} request",
                "config": {"url": url, "method": method},
                "next": [],
            }
        )
        # link from previous
        for n in nodes:
            if n["id"] == prev:
                n["next"] = [nid]
        prev = nid

    if "delay" in text or "wait" in text:
        nid = "delay1"
        ms = 1000
        m = re.search(r"(\d+)\s*(ms|sec|s|seconds?)", text)
        if m:
            val = int(m.group(1))
            unit = m.group(2)
            ms = val if unit == "ms" else val * 1000
        nodes.append(
            {
                "id": nid,
                "type": "delay",
                "label": f"Wait {ms}ms",
                "config": {"ms": ms},
                "next": [],
            }
        )
        for n in nodes:
            if n["id"] == prev:
                n["next"] = [nid]

    if len(nodes) == 1:
        # default chain
        nodes.append(
            {
                "id": "http1",
                "type": "http",
                "label": "POST notify",
                "config": {"url": "https://httpbin.org/post", "method": "POST"},
                "next": [],
            }
        )
        nodes[0]["next"] = ["http1"]

    return {
        "id": str(uuid.uuid4()),
        "name": "Generated from NL",
        "description": body.prompt[:200],
        "nodes": nodes,
        "enabled": True,
    }
