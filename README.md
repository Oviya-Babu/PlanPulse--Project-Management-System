# PlanPulse — Full-Stack Project Management System

PlanPulse is a full-stack, enterprise-grade Project Management System comprising a **responsive Web application**, a **cross-platform Android mobile application**, a **shared Node.js REST API backend**, and a **PostgreSQL relational database**.

The system is designed with a mobile-first responsive UI, strict multi-tenant data isolation, cryptographic credential security, and synchronized cross-platform workflows.

---

## Architecture Overview

```
                               ┌────────────────────────┐
                               │   PostgreSQL Database  │
                               │  (Relational + Checks) │
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

---

## Key Features

- **Authentication & User Management**: Argon2id password hashing with unique salts, stateless Bearer JWT session management, rate-limited auth endpoints, and interactive user profile cards across Web and Mobile.
- **Project Management**: Full CRUD lifecycle, description, status badges (`Not Started`, `In Progress`, `Completed`), planned date ranges with database-level date consistency checks (`end_date >= start_date`).
- **Task Management**: Project-scoped task CRUD, priority badges (`Low`, `Medium`, `High`), lifecycle states (`Pending`, `In Progress`, `Completed`), quick status toggles, and cascade deletion upon project removal (`ON DELETE CASCADE`).
- **Real-Time Dashboard & Workspace KPIs**: Live workspace metrics for Total Projects, In Progress Projects, Total Tasks, Completed Tasks, Pending Tasks, and overall completion percentage with recent projects and urgent deliverables.
- **Server-Side Search & Combinator Filtering**: Fast substring search with SQL LIKE wildcard escaping (`\`, `%`, `_`), multi-parameter combinator filters (status, priority, project), and persistent URL search parameters on Web.
- **Security & Multi-Tenancy**: Zero IDOR / BOLA vulnerability design. All resource queries join on user ownership predicates (`owner_id = user.id`); cross-user resource access returns uniform `404 Not Found` responses.
- **Cross-Platform Parity**: Identical business rules, API envelopes, and unified design tokens across Web and Android Mobile.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js (v20+), Express, TypeScript, Prisma ORM, Argon2id, JWT (`jsonwebtoken`), Pino logger, Helmet, `express-rate-limit`, Zod |
| **Database** | PostgreSQL 16 (WSL2 / Docker), B-Tree composite indexes, Check constraints, Foreign key cascades |
| **Web Frontend** | React 18, Vite, TypeScript, TailwindCSS, Radix UI primitives, TanStack Query, Lucide icons |
| **Mobile Client** | React Native (0.76), Expo SDK 52, TypeScript, React Native Paper (MD3), React Navigation v7, Expo SecureStore |
| **Test & Quality** | Vitest, Supertest, ESLint, TypeScript Strict Mode |

---

## Repository Structure

```
.
├── backend/                  # Shared Node.js REST API (TypeScript)
│   ├── src/
│   │   ├── app.ts            # Express application factory & middleware chain
│   │   ├── server.ts         # Server lifecycle & graceful shutdown
│   │   ├── config.ts         # Environment validation with Zod
│   │   ├── controllers/      # Route controllers with data ownership enforcement
│   │   ├── middleware/       # JWT auth, rate limiter, request logger, error handler
│   │   ├── routes/           # REST routes (auth, projects, tasks, dashboard, health)
│   │   └── lib/              # Prisma client, Pino logger, search wildcard escaper
│   ├── prisma/               # Prisma schema & SQL migrations
│   └── tests/                # Vitest integration test suites (54/54 passing)
├── web/                      # Responsive React Web Application (Vite + Tailwind)
│   ├── src/
│   │   ├── components/ui/    # Accessible design system primitives (Button, Dialog, Dropdown...)
│   │   ├── components/layout/# AppShell, Navbar with interactive user menu
│   │   ├── components/profile/# User profile modal & statistics dialog
│   │   ├── pages/            # Dashboard, Projects, Project Details, Tasks, Profile, Login, Register
│   │   └── lib/              # Axios client, AuthContext, design tokens, utility helpers
│   └── public/               # Static assets & favicon
├── mobile/                   # Android Mobile Application (React Native + Expo SDK 52)
│   ├── src/
│   │   ├── navigation/       # Bottom tabs & stack navigators
│   │   ├── screens/          # Dashboard, Projects, Project Details, Tasks, Profile, Login, Register
│   │   ├── theme/            # Shared token mapping to MD3 theme
│   │   ├── storage/          # Hardware-backed token storage via SecureStore
│   │   └── api/              # Axios API client with interceptors
│   └── app.json              # Expo application configuration
├── docs/                     # Specifications & technical documentation
│   ├── PRD.md                # Product Requirements Document
│   ├── requirement-traceability.md # Complete requirement traceability matrix
│   ├── openapi.yaml          # OpenAPI 3.1 specification for all 15 endpoints
│   ├── er-diagram.md         # Database ER diagram & schema definition
│   └── SECURITY_TODO.md      # Security disclosures & hardening roadmap
├── docker-compose.yml        # PostgreSQL container configuration
├── THIRD_PARTY_NOTICES.md    # Open-source licensing notices
└── package.json              # Monorepo orchestration scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x or v24.x LTS
- **PostgreSQL**: v16+ (Local, Docker, or Ubuntu WSL2)
- **Git**
- Optional: **Android Studio** (for Android Emulator) or an Android device with **Expo Go (SDK 52)**

---

### 1. Database Setup

#### Option A: WSL2 PostgreSQL (Recommended on Windows)
PostgreSQL 16 runs inside Ubuntu 24.04 WSL2 with mirrored networking (`[wsl2]\nnetworkingMode=mirrored` in `~/.wslconfig`), exposing port `5432` directly on `127.0.0.1`.

```bash
# Start PostgreSQL service inside WSL
wsl -u root -d Ubuntu-24.04 service postgresql start

# Apply database migrations from project root
npm --prefix backend run db:migrate:deploy
```

#### Option B: Docker Compose
```bash
docker compose up -d
npm --prefix backend run db:migrate:deploy
```

---

### 2. Running the Shared Backend API

```bash
npm run dev:backend
```
- API Base URL: `http://localhost:4000/api` (listening on `0.0.0.0:4000`)
- Health Check: `http://localhost:4000/api/health`

---

### 3. Running the Web Application

```bash
npm run dev:web
```
- Open browser at: `http://localhost:5173` (or `http://localhost:5174`)
- Connects automatically to the backend at `http://localhost:4000/api` via Vite proxy and Axios.

---

### 4. Running the Mobile Application

```bash
npm run dev:mobile
```

#### Running on Android Emulator:
1. Start an Android Virtual Device in Android Studio.
2. In `mobile/.env`, set:
   ```env
   EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:4000"
   ```
3. Press **`a`** in the Expo terminal to launch on the emulator.

#### Running on a Physical Android Phone (Expo Go SDK 52):
1. Download and install **Expo Go for SDK 52** directly from Expo:
   👉 **[Expo Go SDK 52 Direct APK](https://expo.dev/go?sdkVersion=52&platform=android&device=true)**
2. Connect your mobile phone to the same Wi-Fi network as your computer.
3. Find your PC's local IP address (e.g., `192.168.0.111`).
4. In `mobile/.env`, set:
   ```env
   EXPO_PUBLIC_API_BASE_URL="http://192.168.0.111:4000"
   ```
5. Ensure inbound TCP port 4000 is permitted through Windows Defender Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "PMS Backend API 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
   ```
6. Scan the QR code displayed in the Expo CLI terminal using the Expo Go camera.

#### Instant Browser Preview:
In the terminal running `npm run dev:mobile`, press **`w`** to preview the React Native interface directly in your browser at `http://localhost:8081`.

---

## Environment Configuration

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string with credentials and pool settings | `postgresql://postgres:postgres@localhost:5432/pms_dev?schema=public` |
| `PORT` | Port for the Node.js Express backend server | `4000` |
| `NODE_ENV` | Application environment mode | `development` / `production` |
| `JWT_SECRET` | Secret key used to sign and verify HMAC-SHA256 JWT tokens | `min-32-char-secure-secret-key-for-jwt-signing` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CORS_ORIGIN` | Allowed client origins (supports comma-separated list or `*`) | `http://localhost:5173,http://localhost:5174` |
| `VITE_API_URL` | Base API URL consumed by the Web React application | `http://localhost:4000/api` |
| `EXPO_PUBLIC_API_BASE_URL` | Base API URL consumed by the React Native mobile client | `http://10.0.2.2:4000` (emulator) or LAN IP (phone) |

---

## REST API Overview

All 15 endpoints are documented in detail in [`docs/openapi.yaml`](docs/openapi.yaml).

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Server uptime and PostgreSQL connectivity verification |
| `/api/auth/register` | POST | Public (Rate-limited) | Register user with full name, email, and password |
| `/api/auth/login` | POST | Public (Rate-limited) | Authenticate user credentials, returns JWT and user profile |
| `/api/auth/me` | GET | Bearer JWT | Returns current authenticated user profile |
| `/api/projects` | GET | Bearer JWT | Paginated project listing with search and status filtering |
| `/api/projects` | POST | Bearer JWT | Create a project (name, description, status, dates) |
| `/api/projects/:id` | GET | Bearer JWT | Get project details and child tasks (tenant verified) |
| `/api/projects/:id` | PUT | Bearer JWT | Update project attributes (tenant verified) |
| `/api/projects/:id` | DELETE | Bearer JWT | Delete project and cascade-delete child tasks |
| `/api/tasks` | GET | Bearer JWT | Filtered task listing (search, status, priority, project) |
| `/api/tasks` | POST | Bearer JWT | Create task under an owned project |
| `/api/tasks/:id` | GET | Bearer JWT | Get single task details (tenant verified) |
| `/api/tasks/:id` | PUT | Bearer JWT | Update task attributes (tenant verified) |
| `/api/tasks/:id` | DELETE | Bearer JWT | Delete single task (tenant verified) |
| `/api/dashboard` | GET | Bearer JWT | Aggregated workspace KPI metrics and urgent tasks |

### Uniform Error Structure
All API errors return consistent JSON envelopes:
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found",
  "details": []
}
```

---

## Verification & Quality Commands

All quality gates have been executed and verified across the monorepo:

```bash
# 1. Run Backend Integration Test Suite (54/54 passing)
npm run test:backend

# 2. Run TypeScript Typechecking across all projects (0 errors)
npm run typecheck:all

# 3. Run ESLint across all projects (0 errors)
npm run lint:all

# 4. Verify Production Web Bundle
npm --prefix web run build

# 5. Verify Production Mobile Bundle Export
npm run build:mobile
```

---

## Production Deployment (Render + Vercel)

### Live Production Endpoints

| Service | Platform | URL / Endpoint | Details |
|---|---|---|---|
| **Web Frontend** | Vercel | [`plan-pulse-project-management-system-nxfwvyzvr.vercel.app`](https://plan-pulse-project-management-system-nxfwvyzvr.vercel.app) | React 18, Vite, TailwindCSS, SPA Client-Side Routing |
| **REST API Backend** | Render | [`planpulse-project-management-system.onrender.com`](https://planpulse-project-management-system.onrender.com) | Node.js Express REST API, Prisma ORM |
| **Health Check** | Render | [`/api/health`](https://planpulse-project-management-system.onrender.com/api/health) | Returns database connectivity status & uptime |
| **Database** | Render PostgreSQL | PostgreSQL 16 (Managed) | Auto-migrated via Prisma migrations |

---

### 1. Backend Web Service Configuration (Render)

- **Service Type**: Web Service (Node.js)
- **Repository Branch**: `master`
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` *(runs `npx prisma migrate deploy && node dist/server.js`)*
- **Environment Variables**:
  | Variable | Example / Value | Description |
  |---|---|---|
  | `NODE_ENV` | `production` | Enables production error envelopes & security hardening |
  | `DATABASE_URL` | `postgresql://...` | Connection URI to production PostgreSQL database |
  | `JWT_SECRET` | *(secret)* | Cryptographic HMAC-SHA256 signing key (≥ 32 random characters) |
  | `JWT_EXPIRES_IN` | `1d` | Token lifetime |
  | `CORS_ORIGIN` | `https://plan-pulse-project-management-system-nxfwvyzvr.vercel.app,https://plan-pulse-project-management-system.vercel.app` | Comma-separated allowed frontend origins |
  | `TRUST_PROXY` | `1` | Enables 1 reverse-proxy hop trust for Render load balancer |

> **Automated Production Migrations**: The `npm start` command executes `npx prisma migrate deploy` in safe, transactional mode before starting Express. Every deployment automatically applies pending Prisma schema migrations to the database without data loss.

---

### 2. Frontend Application Configuration (Vercel)

- **Framework Preset**: Vite
- **Repository Branch**: `master`
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  | Variable | Value | Description |
  |---|---|---|
  | `VITE_API_URL` | `https://planpulse-project-management-system.onrender.com/api` | Points Axios client to Render backend |
- **SPA Client-Side Routing**: Configured via [`web/vercel.json`](web/vercel.json):
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
  Ensures browser reloads on `/projects`, `/tasks`, `/profile`, `/login`, and `/register` resolve cleanly without HTTP 404 errors.
- **Deployment Protection**: In Vercel Project Settings → *Deployment Protection*, toggle **Vercel Authentication** **OFF** to permit public access.

---

### 3. Standalone Android APK Distribution
In production, end users install a standalone `.apk` without requiring Expo Go:
```bash
# Install EAS CLI
npm --prefix mobile install -g eas-cli

# Build standalone Android APK
eas build --platform android --profile preview
```
Alternatively, build a local release APK via Android Studio:
```bash
npx --prefix mobile expo run:android --variant release
```

---

## Security Architecture & Known Limitations

### Implemented Safeguards
1. **Cryptographic Passwords**: Passwords hashed using Argon2id with unique salts; plaintext passwords are never logged or stored.
2. **Stateless JWT Sessions**: HMAC-SHA256 authenticated tokens with configurable expiry.
3. **Strict Multi-Tenancy**: All project and task operations verify `owner_id = user.id`. Foreign lookups return uniform `404 Not Found` to eliminate IDOR / BOLA enumeration.
4. **Wildcard Injection Defense**: Search queries escape SQL LIKE wildcards (`\`, `%`, `_`).
5. **Rate Limiting**: `express-rate-limit` throttles failed login attempts with HTTP 429 and `Retry-After` headers.
6. **Encrypted Mobile Storage**: Mobile tokens are persisted securely in hardware keystore via `expo-secure-store`.

### Known Limitations & Roadmap
- **Refresh Token Rotation**: Currently uses stateless JWTs with 7-day expiration. Refresh token rotation with database revocation is scheduled for next iteration (see [`docs/SECURITY_TODO.md`](docs/SECURITY_TODO.md)).
- **Rate Limiter Storage**: Rate limiting currently uses in-memory tracking; Redis adapter is recommended for multi-instance deployments.

---

## Five-Minute Cross-Platform Demo Workflow

Follow these steps to evaluate cross-platform synchronization between Web and Mobile:

1. **Step 1 — Web Registration**:
   - Open Web at `http://localhost:5173`. Click **Sign Up**, register an account (`evaluator@planpulse.io`, password `Password123!`).
   - You are redirected to the Dashboard showing initial 0 KPI counts.

2. **Step 2 — Web Project & Task Creation**:
   - Navigate to **Projects** → click **Create Project**. Name it `Mobile App Launch`, status `In Progress`.
   - Open the project details, click **Add Task**. Create `Design System Token Audit`, priority `High`, status `In Progress`.
   - Create a second task: `API Integration Tests`, priority `Medium`, status `Pending`.

3. **Step 3 — Mobile Sign-In**:
   - Open the Mobile app (via Expo Go on your phone or browser at `http://localhost:8081`).
   - Log in using the same credentials (`evaluator@planpulse.io`, `Password123!`).

4. **Step 4 — Verify Cross-Platform Synchronization**:
   - The Mobile **Dashboard** immediately reflects the project and 2 tasks with overall progress calculated.
   - Navigate to the **Projects** tab on Mobile: `Mobile App Launch` is displayed with its real-time badge.

5. **Step 5 — Mobile Task Action & Dynamic KPI Update**:
   - In Mobile **Tasks**, toggle `Design System Token Audit` to **Completed**.
   - Switch back to the Web application and refresh or view Dashboard: Overall delivery completion and completed task count increment immediately.

6. **Step 6 — Multi-Tenant Security Check**:
   - Register a second user account in an incognito window.
   - Querying the first user's project ID returns `404 Not Found`, confirming zero IDOR leakage.

---

## Documentation Index

- [Product Requirements Document (PRD)](docs/PRD.md)
- [Requirement Traceability Matrix](docs/requirement-traceability.md)
- [OpenAPI 3.1 Specification](docs/openapi.yaml)
- [Entity-Relationship Diagram & Database Guide](docs/er-diagram.md)
- [Security Disclosures & Hardening Roadmap](docs/SECURITY_TODO.md)
- [Third-Party Software Notices](THIRD_PARTY_NOTICES.md)
