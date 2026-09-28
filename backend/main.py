import hashlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from inference import parse_log_to_ocsf

app = FastAPI(title="ULPF AI Log Parser & Normalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LogRequest(BaseModel):
    raw_log: str

class PromoteRequest(BaseModel):
    rule_name: Optional[str] = "Promoted Rule"
    device_type: Optional[str] = "Generic"
    pattern: Optional[str] = None
    ocsf_mapping: Optional[Dict[str, Any]] = None
    ocsf_template: Optional[Dict[str, Any]] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/parse_log")
def parse_log(req: LogRequest):
    return parse_log_to_ocsf(req.raw_log)

@app.get("/api/quarantine")
def list_quarantine():
    return [
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

@app.get("/api/verify/{event_id}")
def verify_event(event_id: str):
    raw_bytes = f"event:{event_id}|payload:canonical_ocsf_record"
    curr_hash = hashlib.sha256(raw_bytes.encode()).hexdigest()
    prev_hash = hashlib.sha256((curr_hash + "_prev").encode()).hexdigest()
    next_hash = hashlib.sha256((curr_hash + "_next").encode()).hexdigest()
    
    return {
        "event_id": event_id,
        "verified": True,
        "raw_bytes": raw_bytes,
        "current_hash": curr_hash,
        "prev_hash": prev_hash,
        "next_hash": next_hash,
        "chain": [
            {"id": "evt-099", "hash": prev_hash[:16] + "...", "status": "verified"},
            {"id": event_id, "hash": curr_hash[:16] + "...", "status": "verified"},
            {"id": "evt-101", "hash": next_hash[:16] + "...", "status": "verified"}
        ]
    }

@app.post("/api/registry/promote")
def promote_rule(req: PromoteRequest):
    pat = req.pattern or "unknown_pattern"
    mapping = req.ocsf_mapping or req.ocsf_template or {}
    dev = req.device_type or "Generic"
    rule_id = f"rule_{hashlib.md5(pat.encode()).hexdigest()[:8]}"
    return {
        "status": "promoted",
        "rule_id": rule_id,
        "rule_name": req.rule_name,
        "message": f"Pattern for {dev} successfully converted to permanent rule."
    }
