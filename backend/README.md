# ULPF Backend — Node.js / Express / Prisma / NeonDB

Log ingestion, deterministic parsing, AI-normalization simulation, and tamper-evidence chain for the Universal Log Pre-processing Framework.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express 4
- **ORM**: Prisma 6 with PostgreSQL (NeonDB)
- **Hashing**: CryptoJS (SHA-256, HMAC)
- **Dev tooling**: `tsx` (TypeScript executor with watch mode)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and add your NeonDB connection string
cp .env.example .env
# Edit .env → set DATABASE_URL to your NeonDB connection string

# 3. Push schema to database
npm run db:push

# 4. Generate Prisma client
npm run db:generate

# 5. Seed demo data
npm run db:seed

# 6. Start dev server (hot-reload)
npm run dev
```

The server runs on `http://localhost:8000` by default.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/quarantine` | List quarantine queue (filter: `?status=unprocessed`) |
| `GET`  | `/api/quarantine/:id` | Get single log by ID |
| `POST` | `/api/quarantine` | Ingest a new raw log |
| `PATCH`| `/api/quarantine/:id` | Update log (Approve & Save) |
| `POST` | `/api/parse_log` | Parse raw log via registry/AI |
| `GET`  | `/api/verify/:event_id` | Tamper-evidence verification |
| `GET`  | `/api/registry` | List all parser registry rules |
| `POST` | `/api/registry/promote` | Promote AI mapping to permanent rule |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma     # Database schema (3 models + enum)
│   └── seed.ts           # Demo data seeder
├── src/
│   ├── server.ts         # Express app entry point
│   ├── lib/
│   │   ├── prisma.ts     # Prisma client singleton
│   │   └── hash.ts       # SHA-256, Merkle tree, signature utils
│   └── routes/
│       ├── quarantine.ts  # Quarantine queue CRUD
│       ├── parseLog.ts    # Log parsing / AI normalization
│       ├── verify.ts      # Tamper-evidence verification
│       └── registry.ts    # Parser registry management
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Database Models

- **QuarantineLog** — Ingested logs with status tracking and OCSF event storage
- **RegistryRule** — Deterministic parser rules (promoted from AI or hand-written)
- **HashChainEntry** — Cryptographic hash chain for tamper evidence
