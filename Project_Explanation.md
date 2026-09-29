# Universal Log Pre-processing Framework (ULPF) — Logसेतु (LogSetu)

This document explains the architecture, flow, and purpose of every component in the ULPF project.

## How the Overall System Works

The ULPF system ingests security logs from various enterprise devices. Since different vendors format logs uniquely, the system's goal is to standardize all of them into a single, unified format known as the **OCSF (Open Cybersecurity Schema Framework)**.

1. **Log Ingestion & Tamper Evidence**: When a log is ingested, a cryptographic hash is immediately generated based on the raw log text and timestamp. This hash is added to a Merkle tree-backed hash chain, proving the log was never altered after ingestion.
2. **Deterministic Parsing**: The backend first tries to parse the log using a fast, deterministic rule registry. If a pattern matches, the log is instantly normalized and marked as resolved.
3. **AI Fallback & Quarantine**: If the log doesn't match any known rule, it is placed in a "Quarantine Queue" with an `UNPROCESSED` state. 
4. **Human Review & AI Inference**: A security analyst reviews quarantined logs via the frontend Dashboard. They can trigger an on-device AI model to attempt parsing the log into valid OCSF JSON.
5. **Validation & Correction**: The backend forces the AI model to output valid JSON. If it fails validation against the OCSF schema, it is retried up to 3 times. If successful, it's returned for human approval. If it completely fails, it is marked as `NEEDS_REVIEW` and requires manual mapping.
6. **Approval & Promotion**: Once the analyst corrects or approves the JSON, it is saved. They can also "Promote" this mapping into a permanent rule, so future logs of the same type are parsed deterministically without AI overhead.

---

## Backend Files in Detail

The backend is built as a robust **Node.js + Express + Prisma API server**, designed to handle raw log ingestion, orchestrate deterministic and AI-based parsing, and enforce cryptographically verifiable tamper-evidence.

### `server.ts`
This is the main entry point and bootstrap file for the backend. 
- It initializes the **Express app** and mounts essential middleware (`cors` for cross-origin requests from the React frontend, and `express.json` with a 10MB limit to handle large log batches).
- It wires up the routing by importing and mounting the four core domain routers (`quarantineRouter`, `parseLogRouter`, `verifyRouter`, `registryRouter`) under the `/api` prefix.
- It provides a global error handler to catch uncaught exceptions and a `/api/health` endpoint used for liveness probes.

### `prisma/schema.prisma`
Defines the single source of truth for the database schema, leveraging Prisma ORM to interact with the PostgreSQL (NeonDB) database. The schema is divided into three core models:
- **`QuarantineLog`**: The primary log table. It tracks the raw ingested log (`rawLog`), parsing status (`UNPROCESSED`, `AI_RESOLVED`, `NEEDS_REVIEW`, `APPROVED`), the number of AI attempts made, and the resulting normalized JSON (`ocsfEvent`). It also holds `hashValue` and `prevHash` to link the log to the cryptographic tamper-evidence chain.
- **`RegistryRule`**: The deterministic rulebook table. When a human analyst approves an AI mapping and decides it applies globally, a rule is saved here with a RegEx `sourcePattern` and an OCSF `classUid`.
- **`HashChainEntry`**: A ledger table specifically for tamper-evidence. It holds a cryptographic hash of a log's raw contents upon ingestion, along with the previous hash in the chain (`prevHash`), an HMAC `signature`, and a recursively computed `merkleRoot`.

### `routes/quarantine.ts`
Manages the lifecycle of logs that have not yet been automatically resolved by the parser registry.
- **`GET /quarantine`** & **`GET /quarantine/:id`**: Provides the data for the frontend's Quarantine Queue table.
- **`POST /quarantine`**: The ingestion endpoint for unparsed logs. Upon receiving a log, it auto-extracts the source IP, saves the log with an `UNPROCESSED` state, and immediately generates a cryptographic block via `computeSHA256` that gets appended to the `HashChainEntry` table.
- **`PATCH /quarantine/:id`**: Allows the frontend to update a log's state (e.g., when an analyst clicks "Approve & Save"). *Crucially*, this endpoint deliberately preserves the original `HashChainEntry`—updating the JSON mapping does not alter the hash of the *original raw log*, maintaining the forensic integrity of the ingested event.

### `routes/parseLog.ts`
The intelligent routing engine for log parsing, containing the `POST /parse_log` endpoint.
- **Step 1: Deterministic Engine**: It first evaluates the log against a fast, in-memory array of RegEx patterns (`REGISTRY_PARSERS`). If a match is found, it maps the log to the corresponding OCSF class instantly without invoking the AI, saving compute cost and latency.
- **Step 2: AI Fallback Engine**: If no pattern matches, it invokes the local AI model (via `callAiModel`). 
- **Persistence**: Depending on the AI's success, the log is persisted into the database as `AI_RESOLVED` (successful parse) or `NEEDS_REVIEW` (failed parse after max retries), and the result is returned to the frontend.

### `routes/registry.ts`
Exposes endpoints to manage the active deterministic rulebook.
- **`POST /registry/promote`**: The most critical feedback-loop endpoint. It takes a log that was successfully parsed by the AI (and approved by a human), extracts the vendor/device pattern, and stores it as a new `RegistryRule`. Future logs matching this pattern will now be instantly parsed in Step 1 of `parseLog.ts`, effectively teaching the system over time and reducing reliance on the AI model.

### `routes/verify.ts`
Provides the cryptographic verification endpoint (`GET /verify/:event_id`).
- When called, it looks up the original `HashChainEntry` for the log.
- It fetches the stored `rawLog` text and ingestion timestamp, and re-computes the SHA-256 hash on the fly.
- By comparing the newly computed hash to the securely stored `hashValue`, it provides mathematical proof that the log text was not maliciously altered or corrupted in the database after it was initially received.

### `lib/hash.ts`
A self-contained cryptographic utility module using `crypto-js`. 
- `computeSHA256`: Standard hashing for individual logs.
- `computeMerkleRoot`: Aggregates an array of hashes into a single root hash, enabling efficient proof-of-inclusion checks.
- `generateSignature`: An HMAC function that signs the hash using a secret key, proving that the hash was generated by the ULPF system and not a malicious actor who gained write access to the database.

### `lib/aiClient.ts`
The bridging module that communicates with the local AI inference engine.
- Contains the `callAiModel` function which handles fetch requests to the external model (e.g., an LLM running locally).
- Enforces strict data typing via `validateOcsfEvent`. If the AI returns malformed JSON or omits required OCSF fields (like `class_uid`), this module intercepts the response and automatically triggers a retry loop (up to 3 times), sending the validation error back to the AI so it can self-correct its output before giving up.

---

## Frontend Files in Detail

The frontend is a React application using Vite, TypeScript, and Tailwind CSS.

### `/frontend/src/main.tsx` & `/frontend/src/index.css`
- `main.tsx`: Mounts the React application to the DOM.
- `index.css`: Imports Tailwind CSS directives.

### `/frontend/src/App.tsx`
The root component that manages the global state and navigation. 
- Maintains the list of quarantine logs and registry rules.
- Handles tab switching between `Quarantine Queue`, `Log Review`, `Tamper Verification`, and `Parser Registry`.
- Contains the `handleApproveAndSave` logic which calls the backend to approve a log and optionally promote it to a registry rule.

### `/frontend/src/api/client.ts`
Contains API wrapper functions to interact with the backend server (`fetch` calls):
- `parseLogApi`: Calls `POST /api/parse_log`.
- `fetchQuarantineLogsApi`: Calls `GET /api/quarantine`.
- `verifyLogIntegrityApi`: Calls `GET /api/verify/:event_id`.
- `promoteToRegistryApi`: Calls `POST /api/registry/promote`.
- `approveLogApi`: Calls `PATCH /api/quarantine/:id`.

### `/frontend/src/api/mockData.ts`
Provides fallback hardcoded data for development/demo purposes in case the backend is unreachable.

### `/frontend/src/components/common/Header.tsx`
The top navigation bar showing the active tab, ULPF branding, and badge counters indicating how many logs are `UNPROCESSED` or `NEEDS_REVIEW`.

### `/frontend/src/components/quarantine/QuarantineTable.tsx`
Displays the list of logs that require attention. It supports filtering by status (Unprocessed, Needs Review, etc.) and allows the analyst to select a log to review.

### `/frontend/src/components/review/LogReviewSplitPane.tsx`
The primary interface for log normalization.
- A two-column layout: Left shows the read-only Raw Log, Right shows the AI output.
- Features a Monaco Editor (`@monaco-editor/react`) for live syntax-highlighted JSON editing.
- Handles the API states (idle, loading, parsed, quarantined, network_error) when the analyst requests an AI inference.
- Provides the "Approve & Save" button and the "Promote to Registry" toggle.

### `/frontend/src/components/tamper/TamperProofPanel.tsx`
A visual dashboard meant for auditing and demos.
- Fetches the hash chain for a given event ID.
- Visually animates a cryptographic check ("recalculating...") on the client side to prove that the hash of the raw log matches the cryptographically signed hash stored in the chain.

### `/frontend/src/components/registry/ParserRegistryView.tsx`
Displays a table of the active deterministic rules (Registry). Shows the regex pattern, mapped OCSF class, and the rule's origin (e.g., promoted by AI).

### UI Components (`/frontend/src/components/ui/` & `common/`)
- `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `table.tsx`: Reusable, styled UI primitives based on Radix UI.
- `DashboardCharts.tsx`, `StatCard.tsx`, `PipelineTriageHUD.tsx`: Various dashboard widgets for data visualization (throughput, severity metrics) utilizing `react-chartjs-2`.
- `LoadingSplash.tsx`: A visually appealing initial boot screen for the SIEM dashboard.
