# Universal Log Pre-processing Framework (ULPF) - Backend Service Specification

This directory will contain the Python/FastAPI or Node/Go microservice handling log ingestion, rulebook parsing, local AI normalization, and tamper-evident blockchain/Merkle verification.

## Implemented API Endpoints Contract

### 1. `POST /api/parse_log`
- **Description**: Parses raw log string via deterministic registry or local AI model.
- **Request**: `{ "raw_log": "..." }`
- **Response (Success)**:
```json
{
  "status": "parsed",
  "attempts": 1,
  "ocsf_event": {
    "class_uid": 3002,
    "category_uid": 3,
    "severity_id": 3,
    "time": "2026-10-24T09:15:32Z",
    "metadata": { "uid": "...", "original_format": "ai_inferred" },
    "unmapped": { "process": "sshd", "src_ip": "192.168.1.55" }
  }
}
```
- **Response (Quarantined)**:
```json
{
  "status": "quarantined",
  "attempts": 3,
  "raw_log": "...",
  "error": "severity_id must be an integer"
}
```

### 2. `GET /api/quarantine`
- **Description**: Retrieves list of logs currently in quarantine queue.

### 3. `GET /api/verify/:event_id`
- **Description**: Returns cryptographic hash chain and Merkle proof for tamper verification.

### 4. `POST /api/registry/promote`
- **Description**: Promotes an approved AI mapping into a deterministic rule.
