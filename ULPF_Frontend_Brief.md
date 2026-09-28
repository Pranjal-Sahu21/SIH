# ULPF Frontend Development Brief
### Parser Management, AI-Assisted Normalization & Tamper-Evidence UI

**Audience:** Next.js/React frontend team
**Author context:** Prepared for hand-off from project lead; backend ML service is built and live-tested
**Status:** Backend contract in this doc reflects the *actual, tested* API — not an earlier draft spec

---

## 0. Read this first — one correction to the original brief

The original task spec assumed an endpoint called `/api/infer_schema` that returns a **YAML mapping** for a human to review. That's not what got built, and the change is deliberate — read why before building anything:

The real, tested endpoint is **`POST /api/parse_log`**, and it returns a **complete OCSF JSON event**, not a YAML fragment. The service doesn't just suggest *how* to map fields — it attempts the full normalization itself, validates its own output against a strict schema, and retries up to 3 times if the output isn't valid. It only asks for human help when it has genuinely failed after those retries.

This matters for what you're building: the UI's job is not "show me a YAML suggestion so I can write the real mapping." It's **"show me what the AI already produced, let me fix it if it's wrong, and let me decide whether this becomes a permanent rule."** That's a materially different (and simpler) screen than the original spec implied — see Section 2.

---

## 1. What the system does — context for the whole team

Enterprise security logs come from hundreds of different device types (firewalls, VPNs, IDS/IPS systems), and every vendor formats its logs differently. ULPF's job is to convert all of them into **OCSF** — a single, standardized event format — so that one dashboard, one search syntax, and one set of detection rules can work across every device.

Most logs are handled by a fast, deterministic rulebook (the **Parser Registry**) — a set of hand-written mapping rules per known device type. This is instant and free — no AI involved.

**When a log doesn't match any existing rule** (a new or unrecognized device type), it's quarantined and offered to a **local AI model** (running entirely on-device — no cloud, no internet dependency) as a fallback. That model:

1. Reads the raw log text.
2. Attempts to produce a fully structured OCSF JSON event (what kind of event it is, how severe, when it happened, and any extra fields it found).
3. Is forced, at a technical level, to only ever output syntactically valid JSON.
4. Has its output automatically checked against a strict schema — if a required field is missing or the wrong type, the system asks the model to fix it and tries again (up to 3 times).
5. If it succeeds, you get a clean structured event, tagged as AI-generated.
6. If it fails 3 times, the raw log is preserved untouched and flagged for a human to look at — **the system never fabricates a plausible-looking but wrong answer.**

The frontend's job is to make both outcomes — success and failure — visible, reviewable, and actionable for a security analyst, and to let a good AI result be "promoted" into a permanent rule so the AI never needs to be asked about that device type again.

---

## 2. User Flow (as it actually works)

```
Analyst opens "Parser Management" screen
        │
        ▼
Sees the Quarantine Queue — a table of raw logs that had no matching registry rule
        │
        ▼
Clicks a row → opens the Log Review screen
        │
        ▼
Clicks "Generate AI Mapping"
        │
        ▼
Frontend calls POST /api/parse_log with the raw log text
        │
        ├─── AI succeeds (status: "parsed") ──────────────┐
        │                                                   │
        └─── AI fails after 3 tries (status: "quarantined") │
                    │                                        │
                    ▼                                        ▼
     Split-pane shows raw log + the LAST attempt's      Split-pane shows raw log +
     error, clearly marked as unresolved                the successful OCSF JSON,
     Analyst manually edits/fixes the JSON               editable
                    │                                        │
                    └───────────────┬────────────────────────┘
                                     ▼
                    Analyst reviews/edits the JSON in the editor
                                     ▼
                    Clicks "Approve & Save"
                                     ▼
              Event is committed as a normalized OCSF record
                                     ▼
        Analyst is offered: "Promote this as a permanent rule?"
        (If yes: future logs matching this device's pattern skip
         the AI entirely and use a fast deterministic rule instead)
```

This "promote to registry" step is the single most important interaction in the whole product — it's what turns a one-off AI rescue into a permanent, zero-cost improvement to the pipeline. Do not treat it as an optional nice-to-have; it should be a clearly visible, primary action on the success path.

---

## 3. Screens & Components

### 3.1 Screen: Parser Management / Quarantine Queue

**Purpose:** Give the analyst a triage view of every log the system couldn't automatically place.

**Data table — required columns:**

| Column | Notes |
|---|---|
| Timestamp | When the log was ingested, not necessarily the log's own internal timestamp |
| Source (device/IP if extractable) | May be "Unknown" — don't assume this field is always populated, since an unrecognized log may not have an obviously extractable IP |
| Raw Log Preview | Truncated first ~80 characters, monospace font, full text available on hover/click |
| Status | One of: **Unprocessed** (never sent to AI yet), **AI-Resolved** (parsed successfully, pending approval), **Needs Review** (AI failed 3 times), **Approved** (committed) |
| Actions | "Review" button opens the split-pane screen |

**Behavior requirements:**
- Sortable by timestamp and status at minimum.
- Filterable by status — analysts will want to see "Needs Review" items separately from "AI-Resolved, just needs a rubber stamp" items, since these require very different attention levels.
- Row count / status summary at the top of the table (e.g. "12 unprocessed · 4 AI-resolved · 2 needs review") — this doubles as a good at-a-glance health indicator for a demo.

### 3.2 Screen: Log Review (Split-Pane Viewer)

**Layout:** Two-column split pane, roughly equal width, full height below a fixed header showing the log's timestamp/source.

**Left pane — Raw Log Panel**
- Strictly read-only.
- Monospace font, preserve whitespace exactly as received (no reformatting or "prettifying" the raw text — the whole point is forensic fidelity to the original).
- No syntax highlighting needed here — it's arbitrary raw text, not a known format.

**Right pane — AI Output Panel**
- Before the analyst clicks "Generate AI Mapping": empty state with a clear call-to-action button and a one-line explanation of what will happen ("Send this log to the local AI model to propose a normalized event").
- **Loading state:** this call can take 15–40 seconds on CPU-only hardware, especially the first request after the model just started. Show a clear, honest loading indicator — not a generic spinner with no context. Suggested copy: "Analyzing log with local AI model — this can take up to a minute." Do not let the UI look frozen or broken during this window; this is expected behavior, not an error.
- **On success (`status: "parsed"`):** inject the returned OCSF JSON into an interactive, syntax-highlighted code editor (Monaco Editor is a good fit — JSON language mode). The editor must be fully editable — the analyst needs to be able to correct field values before approving.
- **On failure (`status: "quarantined"`):** show the raw log is still unresolved. Display the validation error message the API returned (it's a real, specific error like "severity_id must be an integer") in a clearly-marked "Last attempt failed" panel — this is useful diagnostic information for the analyst, not something to hide. Still give them an empty/editable JSON editor pre-filled with a minimal template so they can manually complete the mapping themselves.
- A small metadata strip above the editor showing: number of attempts the AI took, and whether this is an "AI-inferred" or "manually authored" result (this ties into the `original_format` field already present in the API response).

**Bottom action bar:**
- **"Approve & Save"** — commits the (possibly edited) JSON as the final normalized event for this log.
- **"Promote to Registry"** — a secondary but prominent action, only enabled after Approve & Save. Should include a one-line explanation: "Future logs matching this pattern will be parsed instantly, without needing the AI." Treat this as a checkbox/toggle presented at save time, not a separate buried screen — the whole value proposition is that this feels like one seamless action, not extra work.
- **"Discard"** — abandons this review without saving; log stays in the queue.

### 3.3 Component: Tamper-Evidence Verification Panel

**Purpose:** Let an analyst (or a demo audience) prove that a given raw log's stored copy hasn't been altered since it was ingested, using cryptographic proof rather than a trust-me assertion.

**Note for the team:** the backend endpoint for this (something like `GET /api/verify/:event_id`) is **not built yet** — treat this component as a defined contract to build the UI against, with the actual API call wired in once that endpoint exists. Don't block other work on it; build the visual component now against mocked data, swap in the real call later.

**Visual requirements:**
- A horizontal "chain" visual: previous record → this record → next record, each shown as a small block with a truncated hash value.
- Each block gets a status badge: green checkmark (verified, hash matches) or red X (mismatch detected).
- A prominent "Verify Integrity" button that triggers the check. On click:
  1. Show a loading state while the proof is fetched.
  2. Once fetched, the actual hash comparison should visibly happen client-side (this is a deliberate design choice — the point is that the *browser* recomputes and checks the hash, not that it trusts a boolean the server sends). Render this as a brief animated "recalculating..." moment before showing the final verified/failed state, so the verification feels like it's actually happening, not instant and opaque.
- If verification fails (or is deliberately triggered to fail, for demo purposes), the failure state should be visually unmistakable — not a subtle color change. This is meant to be the most convincing 10 seconds of any live demo of this product; don't undersell it visually.

---

## 4. API Integration Contract

### 4.1 `POST /api/parse_log` — live, tested, build against this now

**Request body:**
```json
{ "raw_log": "<the full raw log text as a single string>" }
```

**Response — success case:**
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

**Response — failure case:**
```json
{
  "status": "quarantined",
  "attempts": 3,
  "raw_log": "<original raw log text>",
  "error": "<the specific validation error from the last attempt>"
}
```

**Required frontend states to handle:**
- Idle (before the button is clicked)
- Loading (request in flight — expect 15–40 second duration, design for it explicitly)
- Success — `status: "parsed"`
- Partial failure — `status: "quarantined"` (this is a valid, expected response shape, not an HTTP error — handle it as its own UI state, not through your error-boundary/toast-error path)
- Network/server error (connection refused, 500, timeout) — this is a genuinely different case from `quarantined` and should look different in the UI; one is "the AI tried and honestly couldn't," the other is "something is broken," and conflating them will confuse analysts during a demo or real use

### 4.2 Endpoints not yet built — design against these contracts, wire up later

| Endpoint | Purpose | Notes for frontend |
|---|---|---|
| `GET /api/verify/:event_id` | Returns raw bytes + hash chain + Merkle proof for the tamper-evidence panel | Build the panel now against a mocked response shape; swap in the real call when ready |
| `POST /api/registry/promote` | Converts an approved AI result into a permanent registry rule | Needed for the "Promote to Registry" action in Section 3.2 |
| `GET /api/quarantine` | Lists queued/unresolved logs for the table in Section 3.1 | Needed to populate the Quarantine Queue table |

Flag these explicitly to the backend/pipeline engineer on the team as blocking dependencies for full functionality — you can and should build the UI shell for all three now, since the shapes above are stable enough to design against.

---

## 5. Visual Design Direction

- **Dark mode, SIEM-style aesthetic** — this is the expected visual language for security tooling; a light, consumer-app look will read as less credible to a technical audience/judges.
- **Status color coding**, used consistently everywhere a status appears (table rows, badges, panels):
  - Grey/neutral — Unprocessed
  - Blue or amber — AI-Resolved, pending approval
  - Red — Needs Review / quarantined
  - Green — Approved / Verified
- **Monospace font** (e.g. a code/terminal-style typeface) for anything showing raw log text or JSON — this reinforces "this is real system data," not decorative UI copy.
- Keep the severity scale (0–6, per the OCSF schema this system emits) visually distinct — e.g. a small color-coded pill next to `severity_id` in any event view, so severity is scannable at a glance without reading the raw number.

---

## 6. State Management Notes (conceptual — no implementation prescribed)

- The Quarantine Queue table's data and an individual log's review state should be treated as separate concerns — don't couple the whole table to the loading/error state of one row's AI call.
- The AI call in Section 3.2 is slow (15–40s) and can fail in two structurally different ways (`quarantined` vs. a real network error) — your state model for that screen needs at least three terminal states (success, quarantined, error) plus loading and idle, not a simple boolean `isLoading`/`hasError` pair.
- Edits the analyst makes in the JSON editor should be tracked as "dirty" separately from the original AI output, so "Approve & Save" can distinguish "saved exactly as AI produced it" from "saved after human correction" — this distinction is worth preserving in whatever gets persisted, since it's useful signal for later (how often does the AI need correction?).

---

## 7. Definition of Done for this hand-off

A first complete pass should include:
- [ ] Quarantine Queue table, wired to real or mocked data, with sort/filter by status
- [ ] Split-pane Log Review screen, fully wired to the live `POST /api/parse_log` endpoint
- [ ] All five required states on the AI panel (idle, loading, parsed, quarantined, network error) visually distinct
- [ ] Approve & Save action (can write to local state / a mock store if the persistence endpoint isn't ready yet)
- [ ] Promote to Registry UI (button + explanation), API call stubbed until backend is ready
- [ ] Tamper-Evidence panel, built against mocked verify data, visually complete including both pass/fail states
- [ ] Dark mode styling applied consistently across all of the above

Anything not listed above (e.g. full-text search across the queue, bulk actions, user accounts/auth) is explicitly out of scope for this pass — flag it as future work rather than building it now.
