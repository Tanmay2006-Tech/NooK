# Nook

A production-quality library seat booking prototype. Students browse a live floor map, reserve desks, mark themselves away, and scan QR codes to check in. Librarians get a PIN-protected command centre with real-time occupancy stats, per-student controls, and an activity feed. A background sweep job automatically reclaims abandoned seats every 60 seconds — no manual intervention required.

---

## Features

| Area | Detail |
|---|---|
| **Floor map** | 3 floors, 90 desks across 9 zones; live colour-coded status (free / occupied / away / mine) |
| **Student flow** | Browse → click seat → enter name → 2-hour session; mark Away (20 min grace), release early |
| **QR check-in** | Each desk has a scannable QR code; scanning lands on `/checkin/:deskId` for instant check-in |
| **Inactivity alert** | Server sends a prompt after inactivity; student has 10 min to respond before sweep reclaims the seat |
| **Librarian dashboard** | PIN-protected (`1234`); floor-level occupancy bars, animated map, activity feed, per-student Alert + Force Release |
| **Auto-expiry sweep** | Runs every 60 s; marks `away` sessions abandoned when `awayExpiresAt` passes; releases `active` sessions at `sessionExpiresAt` |
| **Design** | Swiss editorial — Syne + Syne Mono, zero border-radius, warm paper palette, burnt orange accent |

---

## Architecture

```
pnpm monorepo
├── artifacts/
│   ├── api-server/          Express 5 REST API  →  served at /api
│   └── nook/                React + Vite SPA    →  served at /
└── lib/
    ├── db/                  Drizzle ORM + PostgreSQL schema + migrations
    ├── api-spec/            openapi.yaml  (source of truth for all API shapes)
    ├── api-client-react/    Generated React Query hooks  (do not hand-edit)
    └── api-zod/             Generated Zod validation schemas
```

A global reverse proxy routes `/api/*` to the API server and `/*` to the frontend — no CORS configuration needed between the two services.

### Data flow

1. **Frontend** polls `GET /api/desks` every 3 s via generated React Query hook.
2. **API server** reads desk + session state from PostgreSQL and returns a merged view.
3. **Sweep job** runs every 60 s inside the API server process, advancing session state and freeing desks.
4. **`myDeskId`** is stored in `localStorage` (`nook_my_desk_id`) and cleared when the server reports the desk as `free` or `abandoned`.

---

## Database schema

### `desks`

| Column | Type | Description |
|---|---|---|
| `id` | `text` PK | Seat code, e.g. `W1`, `Q9`, `F3` |
| `floor` | `integer` | 1 / 2 / 3 |
| `zone` | `text` | Single-letter zone code (`W`, `Q`, `S`, `C`, `F`, `G`, `R`, `P`, `L`, `A`) |
| `zone_name` | `text` | Human-readable zone name |
| `amenities` | `text[]` | e.g. `["power","wifi","window"]` |
| `status` | `text` | `free` \| `occupied` \| `away` \| `abandoned` |

### `sessions`

| Column | Type | Description |
|---|---|---|
| `id` | `serial` PK | Auto-increment |
| `desk_id` | `text` | FK → `desks.id` |
| `student_name` | `text` | Name entered at check-in |
| `checkin_at` | `timestamptz` | When session started |
| `session_expires_at` | `timestamptz` | 2 hours after check-in |
| `away_at` | `timestamptz` | When student pressed Away |
| `away_expires_at` | `timestamptz` | 20 min after `away_at` |
| `prompt_sent_at` | `timestamptz` | When inactivity alert was dispatched |
| `prompt_responded_at` | `timestamptz` | When student acknowledged the alert |
| `status` | `text` | `active` \| `away` \| `abandoned` \| `released` |
| `released_at` | `timestamptz` | When student released manually or sweep freed seat |

---

## API reference

All routes are prefixed with `/api`.

### Public desk routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check — returns `{ status: "ok" }` |
| `GET` | `/api/desks` | List all desks with live status |
| `GET` | `/api/desks/:deskId` | Get a single desk + its active session |
| `POST` | `/api/desks/:deskId/checkin` | Check in — body: `{ studentName: string }` |
| `POST` | `/api/desks/:deskId/away` | Mark session as Away (starts 20-min grace timer) |
| `POST` | `/api/desks/:deskId/respond` | Respond to inactivity prompt (resets alert) |
| `POST` | `/api/desks/:deskId/release` | Release seat early |

### Librarian routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/librarian/desks` | Full desk + session list with extra fields |
| `POST` | `/api/librarian/desks/:deskId/alert` | Send inactivity prompt to a specific student |
| `POST` | `/api/librarian/desks/:deskId/reset` | Force-release a seat immediately |

> **Librarian PIN** (demo): `1234`. The PIN is validated client-side for this prototype.

---

## Floor map — zones

### Floor 1 (36 desks)

| Zone | Code | Seats | Amenities |
|---|---|---|---|
| Window Row | `W` | W1–W9 | power, wifi, window |
| Quiet Zone | `Q` | Q1–Q9 | power, quiet, wifi |
| Study Pods | `S` | S1–S9 | power, wifi |
| Collaborative | `C` | C1–C9 | wifi, whiteboard |

### Floor 2 (27 desks)

| Zone | Code | Seats | Amenities |
|---|---|---|---|
| Focus Booths | `F` | F1–F9 | power, quiet, wifi |
| Group Study | `G` | G1–G9 | wifi, whiteboard, monitor |
| Reading Nook | `R` | R1–R9 | wifi, natural light |

### Floor 3 (27 desks)

| Zone | Code | Seats | Amenities |
|---|---|---|---|
| Seminar Pods | `P` | P1–P9 | power, wifi, projector |
| Lounge Area | `L` | L1–L9 | wifi, casual seating |
| Archive Alcoves | `A` | A1–A9 | power, quiet, wifi |

---

## Environment variables

Copy `.env.example` to `.env` at the repo root and fill in your values.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string — e.g. `postgres://user:pass@host:5432/dbname` |
| `PORT` | No | API server port (default `8080`) |
| `NOOK_PORT` | No | Frontend dev server port (default `5173`) |
| `BASE_PATH` | No | Frontend base path (default `/`) |
| `API_URL` | No | Backend URL for Vite dev proxy (default `http://localhost:8080`) |
| `LOG_LEVEL` | No | API log level (default `info`) |
| `NODE_ENV` | No | `development` or `production` |



---

## How to run

### Prerequisites

- **Node.js 24+**
- **pnpm 10+** (`npm install -g pnpm`)
- **PostgreSQL** database 

### 1 — Install dependencies

```bash
pnpm install
```

### 2 — Set environment variables

```bash
cp .env.example .env
```

Edit `.env` and set at least `DATABASE_URL`. The API server and Drizzle both read from this file automatically.

### 3 — Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This creates the `desks` and `sessions` tables. The API server seeds all 90 desks automatically on first start (idempotent — safe to run multiple times).

### 4 — Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The API server starts on port `8080`, seeds desks, and launches the 60-second sweep job. It is available at `http://localhost:8080/api`.

### 5 — Start the frontend

Open a second terminal:

```bash
pnpm --filter @workspace/nook run dev
```

The Vite dev server starts on `NOOK_PORT` (default `5173`) and proxies `/api/*` to the backend. Open `http://localhost:5173` in your browser.



### Useful commands

| Command | Description |
|---|---|
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate React Query hooks and Zod schemas from `openapi.yaml` |
| `pnpm --filter @workspace/db run push` | Push schema changes to the database (dev only) |
| `pnpm --filter @workspace/api-server run typecheck` | Typecheck the API server only |
| `pnpm --filter @workspace/nook run typecheck` | Typecheck the frontend only |

> **Do not** run `pnpm dev` at the workspace root — there is no root dev script by design. Always use `--filter` to target a specific package.

---

## Project structure

```
.
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── index.ts              Entry point — Express app, routes, startup
│   │       ├── routes/
│   │       │   ├── desks.ts          Public desk endpoints
│   │       │   └── librarian.ts      Librarian-only endpoints
│   │       └── jobs/
│   │           ├── seed.ts           90-desk idempotent seed
│   │           └── sweep.ts          60-second background sweep
│   └── nook/
│       └── src/
│           ├── App.tsx               Route config + QueryClientProvider
│           ├── index.css             All CSS variables, fonts, animations
│           ├── pages/
│           │   ├── LandingPage.tsx   Home — hero + live occupancy preview
│           │   ├── MapPage.tsx       3-floor interactive seat map
│           │   ├── CheckinPage.tsx   QR code check-in target
│           │   ├── LibrarianPage.tsx PIN-protected dashboard
│           │   └── AnalyticsPage.tsx Occupancy charts
│           ├── components/
│           │   └── FloorMap.tsx      Floor-aware seat grid renderer
│           ├── hooks/
│           │   └── useNookApi.ts     Main data hook (polls API, owns myDeskId)
│           └── data/
│               └── mockDesks.ts      Desk type definitions + ZoneCode union
├── lib/
│   ├── db/src/schema/
│   │   ├── desks.ts                  Drizzle desk table + Zod schema
│   │   └── sessions.ts              Drizzle sessions table + Zod schema
│   ├── api-spec/openapi.yaml         OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/src/generated/api.ts   Generated hooks (do not edit)
│   └── api-zod/                     Generated Zod validation schemas
└── README.md
```

---

## Key architectural decisions

**OpenAPI-first.** All API shapes are defined in `lib/api-spec/openapi.yaml`. After any change, run `pnpm --filter @workspace/api-spec run codegen` to regenerate the React Query hooks and Zod schemas. Never write fetch calls by hand.

**Server-side timers.** Session expiry (`sessionExpiresAt`) and away timer (`awayExpiresAt`) are computed and enforced exclusively by the API server and sweep job. The client never calculates or trusts its own timer state.

**`myDeskId` in localStorage.** The frontend tracks the current user's booked seat via the `nook_my_desk_id` key. It is cleared automatically when the API reports the desk as `free` or `abandoned` — so refreshing the page or opening a new tab restores the correct state.

**Idempotent seed.** The seed job uses `onConflictDoNothing()` — running the server multiple times never duplicates desks or corrupts existing sessions.

---

## Demo credentials

| Role | Access |
|---|---|
| Student | No login required — enter any name at check-in |
| Librarian | Navigate to `/librarian`, enter PIN `1234` |
