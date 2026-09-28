import json
import re
from datetime import datetime, timezone
import os
import uuid
from llama_cpp import Llama, LlamaGrammar
from huggingface_hub import hf_hub_download
from jsonschema import validate, ValidationError

MODEL_REPO = "microsoft/Phi-3-mini-4k-instruct-gguf"
MODEL_FILE = "Phi-3-mini-4k-instruct-q4.gguf"

print("Resolving model (cached after first download)...")
model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)

llm = Llama(
    model_path=model_path,
    n_ctx=4096,
    n_threads=os.cpu_count() or 4,
    n_gpu_layers=0,
    verbose=False
)
grammar = LlamaGrammar.from_file("grammar.gbnf")

with open("ocsf_schema.json") as f:
    OCSF_SCHEMA = json.load(f)

SEVERITY_WORDS = {
    "unknown": 0, "debug": 0, "informational": 1, "info": 1, "notice": 1,
    "low": 2, "warn": 3, "warning": 3, "medium": 3,
    "error": 4, "high": 4, "critical": 5, "crit": 5, "alert": 5,
    "fatal": 6, "emergency": 6,
}

IPV4 = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
CLOCK = re.compile(r"\b\d{2}:\d{2}:\d{2}\b")

def coerce_severity(value):
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        v = value.strip().lower()
        if v.isdigit():
            return int(v)
        return SEVERITY_WORDS.get(v, 3)
    return 3

def check_integrity(parsed: dict, raw_log: str):
    out_text = json.dumps(parsed)
    raw_ips = set(IPV4.findall(raw_log))
    out_ips = set(IPV4.findall(out_text))
    missing = sorted(raw_ips - out_ips)
    invented = sorted(out_ips - raw_ips)
    if missing or invented:
        raise ValidationError(
            f"IP address mismatch. Missing from output: {missing}. Not present in raw log: {invented}. Copy IP addresses exactly as written in the raw log."
        )
    if not CLOCK.search(raw_log) and "time" not in parsed:
        parsed["time"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

SYSTEM_PROMPT = """You are a Cybersecurity SIEM log normalization engine. \
Convert one raw log line into a single OCSF JSON event. Output ONLY the \
JSON object - no explanation, no markdown fences.

Required fields:
- class_uid: integer (e.g. 3002)
- category_uid: integer (e.g. 3)
- severity_id: integer 0-6 (0=Unknown,1=Informational,2=Low,3=Medium,4=High,5=Critical,6=Fatal)
- time: ISO 8601 string
- metadata: object with "uid" (placeholder string) and "original_format" (string)
- unmapped: object holding EACH raw field you cannot confidently map, as
  its OWN separate key. NEVER copy the entire raw log as one blob field.

Common class_uid: 3002=Authentication, 4001=Network Activity, 1007=Process Activity, 4009=DNS Activity.

Example 1 - Authentication log:
Raw log: "Oct 12 10:00:01 host sshd[99]: Accepted password for bob from 10.0.0.5 port 22 ssh2"
Output: {"class_uid": 3002, "category_uid": 3, "severity_id": 1, "time": "2026-10-12T10:00:01Z", "metadata": {"uid": "temp", "original_format": "ai_inferred"}, "unmapped": {"process": "sshd", "user": "bob", "auth_method": "password", "src_ip": "10.0.0.5", "src_port": "22"}}

Example 2 - CEF firewall/network log:
Raw log: "CEF:0|PaloAlto|PAN-OS|10.1|THREAT|url|3|src=10.0.0.5 dst=93.184.216.34 spt=51422 dpt=443 act=blocked"
Output: {"class_uid": 4001, "category_uid": 4, "severity_id": 3, "time": "2026-10-12T10:00:01Z", "metadata": {"uid": "temp", "original_format": "ai_inferred"}, "unmapped": {"vendor": "PaloAlto", "product": "PAN-OS", "src_ip": "10.0.0.5", "dst_ip": "93.184.216.34", "src_port": "51422", "dst_port": "443", "action": "blocked"}}
"""

def build_prompt(raw_log: str, error_note: str = None) -> str:
    repair = f"\nPrevious output was invalid: {error_note}\nFix it." if error_note else ""
    return f"<|system|>\n{SYSTEM_PROMPT}{repair}<|end|>\n<|user|>\nRaw log:\n{raw_log}<|end|>\n<|assistant|>\n"

def parse_log_to_ocsf(raw_log: str, max_retries: int = 3) -> dict:
    error_note = None
    for attempt in range(1, max_retries + 1):
        prompt = build_prompt(raw_log, error_note)
        output = llm(prompt, grammar=grammar, max_tokens=600, temperature=0.1, stop=["<|end|>"])
        text = output["choices"][0]["text"].strip()
        try:
            parsed = json.loads(text)
            parsed["severity_id"] = coerce_severity(parsed.get("severity_id"))
            if isinstance(parsed.get("class_uid"), int):
                parsed["category_uid"] = parsed["class_uid"] // 1000
            check_integrity(parsed, raw_log)
            if not isinstance(parsed.get("metadata"), dict):
                parsed["metadata"] = {}
            parsed["metadata"]["uid"] = str(uuid.uuid4())
            parsed["metadata"]["original_format"] = "ai_inferred"
            validate(instance=parsed, schema=OCSF_SCHEMA)
            return {"status": "parsed", "attempts": attempt, "ocsf_event": parsed}
        except (json.JSONDecodeError, ValidationError, TypeError, KeyError) as e:
            error_note = str(e)
            continue
    return {
        "status": "quarantined",
        "attempts": max_retries,
        "raw_log": raw_log,
        "error": error_note or "Validation failed after maximum retries"
    }
