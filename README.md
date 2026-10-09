# PlanPulse — Enterprise Project Management System

PlanPulse is a full-stack, enterprise-grade Project Management System architected for high reliability, responsiveness, and multi-tenant security across Web, Mobile, and Cloud environments.

---

## Architecture Overview

```
                               ┌────────────────────────┐
                               │   PostgreSQL Database  │
                               │ (pms_dev / pms_test)   │
                               └───────────▲────────────┘
                                           │
                                           │ Prisma ORM (Connection Pool)
                                           │
                               ┌───────────┴────────────┐
                               │   Node.js / Express    │
                               │   API Backend (4000)   │
                               └─────▲────────────▲─────┘
                                     │            │
            REST API (JSON / JWT)    │            │  REST API (JSON / JWT)
      ┌───────────────────────────────┘            └──────────────────────────────┐
      │                                                                           │
┌─────┴──────────────────────────┐                           ┌────────────────────┴───────────┐
│       React Web App            │                           │      React Native Mobile       │
│  (Vite + Tailwind @ 5173/5174) │                           │     (Expo SDK 52 + Paper MD3)  │
└────────────────────────────────┘                           └────────────────────────────────┘
```

### Core Technologies
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Argon2id, JSON Web Tokens (JWT), Pino logger, Helmet, Zod validation, `express-rate-limit`.
- **Database**: PostgreSQL 16 (WSL2 / Docker), strict foreign keys, composite indexes, database-level CHECK constraints.
- **Web**: React 18, Vite, TypeScript, TailwindCSS, Lucide icons, responsive layout, unified design tokens, URL query param persistence.
- **Mobile**: React Native, Expo SDK 52, TypeScript, React Native Paper (Material Design 3), React Navigation, `expo-secure-store` for hardware-backed token security.

---

## Repository Structure

```
.
├── backend/                  # Express REST API (TypeScript)
│   ├── src/
│   │   ├── app.ts            # Express application factory & middleware chain
│   │   ├── server.ts         # Server lifecycle & graceful shutdown
│   │   ├── config.ts         # Environment validation (Zod)
│   │   ├── errors/           # Standard AppError hierarchy & formatters
│   │   ├── middleware/       # Auth (JWT), Rate limiting, Logging, Validation
│   │   ├── routes/           # Auth, Projects, Tasks, Dashboard, Health
│   │   ├── controllers/      # Request handlers & ownership checks
│   │   └── lib/              # Prisma client, Pino logger, Wildcard escaper
│   ├── prisma/               # Prisma schema & SQL migrations
│   └── tests/                # Vitest integration tests (54/54 passing)
├── web/                      # React SPA (Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/ui/    # Accessible design system components (Button, Modal, Input...)
│   │   ├── components/layout/# AppShell, Sidebar, Header, UserMenu
│   │   ├── pages/            # Dashboard, Projects, Tasks, Login, Register
│   │   └── lib/              # Axios API client, AuthContext, Design tokens
│   └── public/               # Static assets & favicon
├── mobile/                   # React Native mobile client (Expo SDK 52)
│   ├── src/
│   │   ├── navigation/       # React Navigation bottom tabs & auth stack
│   │   ├── screens/          # Dashboard, Projects, Tasks, Login, Register
│   │   ├── theme/            # Shared token mapping to MD3 theme
│   │   ├── storage/          # SecureStore JWT token storage
│   │   └── api/              # Axios client with request & error interceptors
│   └── app.json              # Expo configuration
├── docs/                     # Technical specifications & documentation
│   ├── openapi.yaml          # Full OpenAPI 3.1 specification for all 15 endpoints
│   ├── er-diagram.md         # Database ER diagram & schema definition
│   └── SECURITY_TODO.md      # Security disclosures & hardening roadmap
├── docker-compose.yml        # PostgreSQL container configuration
├── THIRD_PARTY_NOTICES.md    # Open-source licensing notices
└── package.json              # Monorepo task orchestration scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x or v24.x LTS
- **PostgreSQL**: v16+ (Local, Docker, or Ubuntu WSL2)
- **Git**
- Optional: **Android Studio** (for Android Emulator) or physical Android device with **Expo Go (SDK 52)**

---

### 1. Database Setup (Windows WSL2 or Docker)

#### Option A: WSL2 PostgreSQL (Recommended on Windows)
PostgreSQL 16 runs inside Ubuntu 24.04 WSL2 with mirrored networking enabled via `~/.wslconfig` (`[wsl2]\nnetworkingMode=mirrored`), exposing port `5432` directly on `127.0.0.1`.

```bash
# Start PostgreSQL service inside WSL
wsl -u root -d Ubuntu-24.04 service postgresql start

# Run database migrations from repo root
npm --prefix backend run db:migrate:deploy
```

#### Option B: Docker Compose
```bash
docker compose up -d
npm --prefix backend run db:migrate:deploy
```

---

### 2. Running Backend (Node.js API)

```bash
npm run dev:backend
```
- API listening on `http://0.0.0.0:4000/api`
- Health check: `http://localhost:4000/api/health`
- Environment config: see [`backend/.env.example`](backend/.env.example)

---

### 3. Running Web Application

```bash
npm run dev:web
```
- Web application opens at `http://localhost:5173` (or `http://localhost:5174`)
- Connects automatically to the backend at `http://localhost:4000/api` via Vite proxy and Axios.

---

### 4. Running Mobile Application

```bash
npm run dev:mobile
```

#### Running on Android Emulator:
1. Start your Android Emulator in Android Studio.
2. In `mobile/.env`, ensure base URL points to the host loopback:
   ```env
   EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:4000"
   ```
3. Press **`a`** in the Expo terminal to launch on Android.

#### Running on a Physical Phone (Expo Go SDK 52):
1. Install **Expo Go** for SDK 52 on your mobile device.
2. Connect your computer and mobile phone to the same Wi-Fi network.
3. Find your PC's Wi-Fi IP address (e.g. `192.168.0.111`).
4. In `mobile/.env`, set:
   ```env
   EXPO_PUBLIC_API_BASE_URL="http://192.168.0.111:4000"
   ```
5. Allow inbound port 4000 in Windows Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "PMS Backend API 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
   ```
6. Scan the QR code in the Expo CLI terminal using the Expo Go camera/scanner.

---

## REST API Overview

All API endpoints are documented in detail in [`docs/openapi.yaml`](docs/openapi.yaml).

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Healthcheck and PostgreSQL connectivity status |
| `/api/auth/register` | POST | Public (Rate-limited) | Register user with full name, email, and password |
| `/api/auth/login` | POST | Public (Rate-limited) | Authenticate user, returns JWT and user profile |
| `/api/auth/me` | GET | Bearer JWT | Returns current authenticated user profile |
| `/api/projects` | GET | Bearer JWT | List projects with search, status filter, and pagination |
| `/api/projects` | POST | Bearer JWT | Create a new project (name, dates, status, description) |
| `/api/projects/:id` | GET | Bearer JWT | Get project details and child tasks (ownership validated) |
| `/api/projects/:id` | PUT | Bearer JWT | Update project attributes (ownership validated) |
| `/api/projects/:id` | DELETE | Bearer JWT | Delete project and cascade-delete child tasks |
| `/api/tasks` | GET | Bearer JWT | List tasks with search, status, priority, and project filter |
| `/api/tasks` | POST | Bearer JWT | Create task under a project owned by user |
| `/api/tasks/:id` | GET | Bearer JWT | Get single task details (tenant isolated) |
| `/api/tasks/:id` | PUT | Bearer JWT | Update task fields (tenant isolated) |
| `/api/tasks/:id` | DELETE | Bearer JWT | Delete single task (tenant isolated) |
| `/api/dashboard` | GET | Bearer JWT | Aggregated metrics, recent projects, and urgent tasks |

### Uniform Error Structure
All API errors return consistent JSON envelopes:
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found",
  "details": []
}
```
Cross-tenant access attempts return `404 NOT_FOUND` to prevent IDOR / BOLA vulnerability enumeration.

---

## Design System Tokens

Unified design tokens across Web (`web/src/lib/tokens.ts`) and Mobile (`mobile/src/theme/index.ts`):

- **Primary Color**: `#2563EB` (Blue 600)
- **Background**: `#F8FAFC` (Slate 50)
- **Surface**: `#FFFFFF` (White)
- **Status Not Started / Pending**: `#64748B` (Slate 500)
- **Status In Progress**: `#D97706` (Amber 600)
- **Status Completed**: `#16A34A` (Emerald 600)
- **Priority Low**: `#0284C7` (Sky 600)
- **Priority Medium**: `#D97706` (Amber 600)
- **Priority High**: `#DC2626` (Red 600)

---

## Verification & Quality Gates

Run all quality checks across the entire monorepo:

```bash
# 1. Run Backend Integration Test Suite (54/54 passing)
npm run test:backend

# 2. Run TypeScript Typechecking across all projects (backend, web, mobile)
npm run typecheck:all

# 3. Run ESLint across all projects
npm run lint:all

# 4. Verify Web Production Build
npm --prefix web run build

# 5. Verify Mobile Android Bundle Export
npm run build:mobile
```

---

## PRD §45 Quality Gate Self-Audit

| Gate Criterion | Status | Evidence |
|---|---|---|
| **Zero IDOR / BOLA Leaks** | Verified | All project/task lookups join on `owner_id = userId`. Tests in `security.test.ts` verify 404 on cross-user queries. |
| **SQL Injection & Wildcard Defense** | Verified | Prisma parameterized queries + `escapeLikeWildcards` for `\`, `%`, and `_`. |
| **Brute Force Protection** | Verified | `loginLimiter` tracks failed logins and returns `429 RATE_LIMITED` with `Retry-After`. |
| **Database Cascades & Constraints** | Verified | Project deletion cascades to tasks in PostgreSQL; DB check constraints reject invalid date ranges. |
| **Cross-Platform Parity** | Verified | Same authentication, projects, tasks, dashboard, and search features implemented on both Web and Mobile. |
| **Offline & Token Persistence** | Verified | Mobile uses `expo-secure-store` for encrypted token storage with automatic auth restore. |
| **Complete OpenAPI 3.1 Specification** | Verified | [`docs/openapi.yaml`](docs/openapi.yaml) details all 15 endpoints with schemas and error codes. |
| **Relational Schema & ERD** | Verified | [`docs/er-diagram.md`](docs/er-diagram.md) documents tables, foreign keys, cascades, and Mermaid diagram. |

---

## Documentation Links
- [OpenAPI Specification](docs/openapi.yaml)
- [Entity-Relationship Diagram](docs/er-diagram.md)
- [Security TODO & Hardening](docs/SECURITY_TODO.md)
- [Third-Party Licenses](THIRD_PARTY_NOTICES.md)
