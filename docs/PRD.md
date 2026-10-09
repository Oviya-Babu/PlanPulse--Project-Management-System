# PlanPulse — Product Requirements Document (PRD)

**Project Management System (Web + Android Mobile + Node.js Backend)**

---

## 1. Executive Summary

**PlanPulse** is an enterprise-grade Project Management System designed to allow users to create projects, organize deliverables into tasks, monitor project lifecycles, and track workspace metrics via real-time dashboards.

The platform provides a unified cross-platform experience across:
- **Responsive Web Application**: React 18, Vite, TypeScript, TailwindCSS, accessible design primitives.
- **Native Android Application**: React Native, Expo SDK 52, TypeScript, Material Design 3 (React Native Paper).
- **Unified Node.js REST API Backend**: Express, TypeScript, Prisma ORM, PostgreSQL database, Argon2id security, stateless Bearer JWT.

---

## 2. Core Functional Requirements

### 2.1 Authentication & Multi-Tenancy
- **User Registration**: Full name, RFC 5322 email validation, password (minimum 8 characters).
- **Authentication**: Argon2id password hashing with unique salt, stateless JWT issued on login.
- **Profile Management**: Profile inspection, active session tracking, and secure logout.
- **Strict Data Ownership**: All queries enforce tenant isolation (`owner_id = userId` or `project.owner_id = userId`). Cross-tenant requests return uniform `404 NOT_FOUND` to eliminate IDOR / BOLA enumeration.

### 2.2 Project Management
- **Project Attributes**: Name (required, max 120 chars), Description, Status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), Start Date, End Date.
- **Temporal Integrity**: Database-level check constraint enforcing `end_date >= start_date` when both dates are present.
- **CRUD Operations**: Create, list with pagination/search, view details with child tasks, update attributes, and delete with cascade deletion of child tasks.

### 2.3 Task Management
- **Task Attributes**: Name (required, max 150 chars), Description, Priority (`LOW`, `MEDIUM`, `HIGH`), Status (`PENDING`, `IN_PROGRESS`, `COMPLETED`), Due Date, Project Association.
- **CRUD & Quick Actions**: Create task under owned project, list tasks, filter by project, priority, and status, update task attributes, quick status toggling, and delete task.
- **Referential Integrity**: PostgreSQL `ON DELETE CASCADE` ensures deleting a project atomically purges all child tasks.

### 2.4 Dashboard & Workspace Metrics
- **Aggregated KPI Counts**:
  - Total Projects
  - Projects In Progress
  - Total Tasks
  - Completed Tasks
  - Pending Tasks
  - Overall Delivery Completion Percentage
- **Recent Deliverables**: Recent projects and urgent tasks due soon.
- **Dynamic Updates**: Modifying tasks or projects immediately updates dashboard statistics.

### 2.5 Server-Side Search & Filtering
- **Wildcard Defense**: SQL LIKE search queries safely escape `\`, `%`, and `_` wildcards.
- **Combinator Filtering**: Multi-parameter filtering across status, priority, and project scope.
- **URL Parameter Synchronization**: Web filters sync with browser query parameters for persistent state and sharing.

---

## 3. System Architecture & Technical Stack

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

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, Argon2id, JWT, Pino logger, Helmet, express-rate-limit, Zod |
| **Database** | PostgreSQL 16 (WSL2 / Docker), B-Tree composite indexes, Check constraints, Cascade deletes |
| **Web Frontend** | React 18, Vite, TypeScript, TailwindCSS, Radix UI, TanStack Query, Lucide icons |
| **Mobile Client** | React Native, Expo SDK 52, TypeScript, React Native Paper (MD3), React Navigation, Expo SecureStore |

---

## 4. REST API Endpoints

The complete API contract is documented in [`docs/openapi.yaml`](openapi.yaml).

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Database connectivity and system health check |
| `/api/auth/register` | POST | Public | Register new user account (rate-limited) |
| `/api/auth/login` | POST | Public | Authenticate user credentials, returns JWT (rate-limited) |
| `/api/auth/me` | GET | Authenticated | Retrieve authenticated user profile |
| `/api/projects` | GET | Authenticated | Paginated project listing with search and status filter |
| `/api/projects` | POST | Authenticated | Create a new project |
| `/api/projects/:id` | GET | Authenticated | Retrieve project details and child tasks (tenant verified) |
| `/api/projects/:id` | PUT | Authenticated | Update project details (tenant verified) |
| `/api/projects/:id` | DELETE | Authenticated | Delete project and cascade-delete child tasks |
| `/api/tasks` | GET | Authenticated | Filtered task listing (search, status, priority, project) |
| `/api/tasks` | POST | Authenticated | Create task under owned project |
| `/api/tasks/:id` | GET | Authenticated | Retrieve single task details (tenant verified) |
| `/api/tasks/:id` | PUT | Authenticated | Update task fields (tenant verified) |
| `/api/tasks/:id` | DELETE | Authenticated | Delete single task (tenant verified) |
| `/api/dashboard` | GET | Authenticated | Workspace KPI counts and urgent items |

---

## 5. Security & Reliability Architecture

1. **Defense-in-Depth Authentication**: Argon2id password hashing + Bearer JWT session.
2. **Strict Multi-Tenancy**: Every data access path verifies user identity at the database query level.
3. **Uniform Error Structure**: Errors return consistent `{ code, message, details }` envelopes. Missing or unauthorized foreign IDs return uniform 404s to avoid IDOR leaks.
4. **Brute-Force Protection**: `express-rate-limit` throttles failed login attempts with HTTP 429 and `Retry-After` headers.
5. **Secure Storage**: Mobile uses hardware-backed `expo-secure-store` for cryptographic token storage.
