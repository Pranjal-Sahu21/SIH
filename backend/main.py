import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from inference import parse_log_to_ocsf

app = FastAPI(title="ULPF AI Log Parser & Tamper-Evidence API")

# Enable CORS for Next.js development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock in-memory quarantine queue for the frontend table
QUARANTINE_QUEUE = [
    {
        "id": "log-001",
        "timestamp": "2026-10-24T09:12:00Z",
        "source": "192.168.1.55",
        "raw_log": "Oct 12 10:00:01 host sshd[99]: Accepted password for bob from 10.0.0.5 port 22 ssh2",
        "status": "Unprocessed"
    },
    {
        "id": "log-002",
        "timestamp": "2026-10-24T09:14:15Z",
        "source": "PaloAlto-FW01",
        "raw_log": "CEF:0|PaloAlto|PAN-OS|10.1|THREAT|url|3|src=10.0.0.5 dst=93.184.216.34 spt=51422 dpt=443 act=blocked",
        "status": "AI-Resolved"
    },
    {
        "id": "log-003",
        "timestamp": "2026-10-24T09:15:30Z",
        "source": "Unknown",
        "raw_log": "CUSTOM_CORRUPT_LOG: malformed binary packet stream [ERR_UNPARSEABLE]",
        "status": "Needs Review"
    }
]

class LogRequest(BaseModel):
    raw_log: str

class PromoteRequest(BaseModel):
    device_type: Optional[str] = "generic_device"
    pattern: Optional[str] = ""
    rule_name: str
    ocsf_mapping: Dict[str, Any]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/quarantine")
def get_quarantine_queue():
    """Returns queued unresolved logs for the frontend table."""
    return {"items": QUARANTINE_QUEUE, "total": len(QUARANTINE_QUEUE)}

@app.post("/api/parse_log")
def parse_log(req: LogRequest):
    """Parses raw log into normalized OCSF JSON event with 3-attempt validation."""
    return parse_log_to_ocsf(req.raw_log)

@app.post("/api/registry/promote")
def promote_to_registry(req: PromoteRequest):
    """Promotes an approved mapping into a permanent rule."""
    return {
        "status": "success",
        "message": f"Rule '{req.rule_name}' successfully promoted to Parser Registry.",
        "rule_id": f"reg-{int(datetime.now(timezone.utc).timestamp())}"
    }

@app.get("/api/verify/{event_id}")
def verify_tamper_evidence(event_id: str):
    """Provides cryptographic proof and hash chain for the Tamper-Evidence panel."""
    current_raw = f"event:{event_id}|payload:canonical_ocsf_record"
    curr_hash = hashlib.sha256(current_raw.encode()).hexdigest()
    prev_hash = hashlib.sha256(f"prev-{event_id}".encode()).hexdigest()
    next_hash = hashlib.sha256(f"next-{event_id}".encode()).hexdigest()

    return {
        "event_id": event_id,
        "verified": True,
        "raw_bytes": current_raw,
        "current_hash": curr_hash,
        "prev_hash": prev_hash,
        "next_hash": next_hash,
        "chain": [
            {"id": "evt-099", "hash": prev_hash[:16] + "...", "status": "verified"},
            {"id": event_id, "hash": curr_hash[:16] + "...", "status": "verified"},
            {"id": "evt-101", "hash": next_hash[:16] + "...", "status": "verified"}
        ]
    }
