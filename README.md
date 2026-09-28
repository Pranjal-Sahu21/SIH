# Universal Log Pre-processing Framework (ULPF) — SIH

**Smart India Hackathon (SIH) Project**

ULPF (OmniLog AI) is an enterprise-grade, air-gapped ready log ingestion, normalization, and tamper-verification system designed to parse heterogeneous log sources into the standardized **OCSF (Open Cybersecurity Schema Framework)** event taxonomy.

## Repository Structure

```
.
├── frontend/             # React + Vite + Tailwind CSS Dark Theme Dashboard
├── backend/              # Log Processing Engine & AI Normalization Microservice
└── ULPF_Frontend_Brief.md # Detailed frontend requirement & API contract specification
```

## Frontend Architecture

- **Framework**: React 18+ (Vite, TypeScript)
- **Styling**: Tailwind CSS (Clean Dark SIEM Aesthetic with General Sans typography)
- **Visualization**: Chart.js (`react-chartjs-2`) for real-time throughput & severity taxonomy
- **Code Editor**: Monaco Editor (`@monaco-editor/react`) for interactive OCSF JSON editing
- **Animations**: Framer Motion for UI transitions & slide-out navigation drawers
- **API Mode**: Live backend endpoints (`/api/parse_log`, `/api/quarantine`, etc.) with built-in fallback.

## Quick Start (Frontend)

```bash
cd frontend
npm install
npm run dev
```
