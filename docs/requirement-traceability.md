# PlanPulse — Requirement Traceability Matrix

This matrix maps every functional and non-functional requirement from the original internship task specification (`Intern_Task_Full_Stack_Developer.pdf`) and the Product Requirements Document to the actual implementation across Backend, Web, Mobile, Database, and automated test verification.

---

## 1. Assignment Core Traceability Matrix

| Req ID | Requirement Description | Backend Implementation | Web Implementation | Mobile Implementation | Database Schema | Verification & Test Evidence |
|---|---|---|---|---|---|---|
| **SRC-01** | User Registration with name, email, password | `backend/src/controllers/auth.controller.ts` (`register`) | `web/src/pages/RegisterPage.tsx` | `mobile/src/screens/RegisterScreen.tsx` | `users` table (`full_name`, `email`, `password_hash`) | `auth.test.ts` (POST /api/auth/register returns 201) |
| **SRC-02** | User Login with email & password | `backend/src/controllers/auth.controller.ts` (`login`) | `web/src/pages/LoginPage.tsx` | `mobile/src/screens/LoginScreen.tsx` | Argon2id verification + JWT generation | `auth.test.ts` (POST /api/auth/login returns JWT) |
| **SRC-03** | JWT Authentication across all protected APIs | `backend/src/middleware/auth.ts` (`requireAuth`) | `web/src/lib/api.ts` (Axios Bearer interceptor) | `mobile/src/api/client.ts` (Axios Bearer interceptor) | Bearer header validation | `security.test.ts` (401 on missing/invalid token) |
| **SRC-04** | Project Creation (name, description, status, dates) | `backend/src/controllers/project.controller.ts` (`createProject`) | `web/src/components/projects/ProjectDialog.tsx` | `mobile/src/screens/ProjectsScreen.tsx` (FAB + Dialog) | `projects` table (`owner_id`, `name`, `status`, `dates`) | `projects.test.ts` (POST /api/projects creates record) |
| **SRC-05** | Project Listing with search & status filter | `backend/src/controllers/project.controller.ts` (`getProjects`) | `web/src/pages/ProjectsPage.tsx` | `mobile/src/screens/ProjectsScreen.tsx` | Composite indexes `(owner_id, status)` | `projects.test.ts`, `search.test.ts` |
| **SRC-06** | Project Details View with associated tasks | `backend/src/controllers/project.controller.ts` (`getProjectById`) | `web/src/pages/ProjectDetailsPage.tsx` | `mobile/src/screens/ProjectDetailsScreen.tsx` | Foreign key relation `tasks.project_id` | `projects.test.ts` (GET /api/projects/:id includes tasks) |
| **SRC-07** | Project Update & Status Change | `backend/src/controllers/project.controller.ts` (`updateProject`) | `web/src/components/projects/ProjectDialog.tsx` | `mobile/src/screens/ProjectDetailsScreen.tsx` | `ProjectStatus` enum | `projects.test.ts` (PUT /api/projects/:id updates status) |
| **SRC-08** | Project Deletion with Task Cascade | `backend/src/controllers/project.controller.ts` (`deleteProject`) | `web/src/pages/ProjectsPage.tsx` | `mobile/src/screens/ProjectsScreen.tsx` | `ON DELETE CASCADE` on `tasks.project_id` | `projects.test.ts` (DELETE cascades child tasks) |
| **SRC-09** | Task Creation under a project | `backend/src/controllers/task.controller.ts` (`createTask`) | `web/src/components/tasks/TaskDialog.tsx` | `mobile/src/screens/ProjectDetailsScreen.tsx` | `tasks` table (`project_id`, `name`, `priority`, `status`) | `tasks.test.ts` (POST /api/tasks returns 201) |
| **SRC-10** | Task Listing with search, status, priority filters | `backend/src/controllers/task.controller.ts` (`getTasks`) | `web/src/pages/TasksPage.tsx` | `mobile/src/screens/TasksScreen.tsx` | Composite indexes `(project_id, status, priority)` | `tasks.test.ts`, `search.test.ts` |
| **SRC-11** | Task Update & Quick Status Toggle | `backend/src/controllers/task.controller.ts` (`updateTask`) | `web/src/components/tasks/TaskCard.tsx` | `mobile/src/screens/TasksScreen.tsx` | `TaskStatus` & `TaskPriority` enums | `tasks.test.ts` (PUT /api/tasks/:id updates status) |
| **SRC-12** | Task Deletion | `backend/src/controllers/task.controller.ts` (`deleteTask`) | `web/src/components/tasks/TaskCard.tsx` | `mobile/src/screens/TasksScreen.tsx` | Primary key UUID lookup + ownership check | `tasks.test.ts` (DELETE /api/tasks/:id returns 204) |
| **SRC-13** | Dashboard Workspace KPI Metrics | `backend/src/controllers/dashboard.controller.ts` | `web/src/pages/DashboardPage.tsx` | `mobile/src/screens/DashboardScreen.tsx` | SQL aggregate counts (`COUNT`, `WHERE`) | `dashboard.test.ts` (GET /api/dashboard returns counts) |
| **SRC-14** | Dashboard Recent Projects & Urgent Tasks | `backend/src/controllers/dashboard.controller.ts` | `web/src/pages/DashboardPage.tsx` | `mobile/src/screens/DashboardScreen.tsx` | SQL ordering by `created_at DESC` & `due_date ASC` | `dashboard.test.ts` (returns recentProjects & urgentTasks) |
| **SRC-15** | Server-Side Search with Wildcard Escaping | `backend/src/lib/search.ts` (`escapeLikeWildcards`) | `web/src/pages/ProjectsPage.tsx`, `TasksPage.tsx` | `mobile/src/screens/TasksScreen.tsx`, `ProjectsScreen.tsx` | Prisma `contains` + escaped `\`, `%`, `_` | `search.test.ts` (literal `%` and `_` matching) |
| **SRC-16** | Strict Multi-Tenant Isolation (Zero BOLA / IDOR) | `backend/src/controllers/*.ts` (all join on `owner_id = user.id`) | Uniform error handling | Uniform error handling | Database-level foreign key predicates | `security.test.ts` (404 on accessing foreign resources) |
| **SRC-17** | Rate Limiting on Authentication | `backend/src/middleware/rateLimiter.ts` | Displays 429 Retry-After | Displays 429 Retry-After | In-memory token bucket via `express-rate-limit` | `security.test.ts` (429 on excessive failed logins) |
| **SRC-18** | Unified Design System Tokens | `backend/src/` (standard enums) | `web/src/lib/tokens.ts` | `mobile/src/theme/index.ts` | Shared status & priority color hex values | Verified across Web and Mobile UI components |
| **SRC-19** | Hardware-Backed Secure Token Storage | JWT standard payload | Browser `localStorage` + session listener | `expo-secure-store` encrypted keychain | Client-side encrypted storage | `mobile/src/storage/token.ts` verified |
| **SRC-20** | Cross-Platform Data Synchronization | Single shared Node.js REST API | Real-time fetch & TanStack Query | Real-time fetch & pull-to-refresh | Single PostgreSQL database | Verified cross-platform workflow in 5-minute demo |

---

## 2. API Contract Verification (15 of 15 Endpoints)

| Endpoint | Method | Specification | Implementation File | Test Suite |
|---|---|---|---|---|
| `/api/health` | GET | `docs/openapi.yaml` | `backend/src/routes/health.routes.ts` | `health.test.ts` |
| `/api/auth/register` | POST | `docs/openapi.yaml` | `backend/src/routes/auth.routes.ts` | `auth.test.ts` |
| `/api/auth/login` | POST | `docs/openapi.yaml` | `backend/src/routes/auth.routes.ts` | `auth.test.ts` |
| `/api/auth/me` | GET | `docs/openapi.yaml` | `backend/src/routes/auth.routes.ts` | `auth.test.ts` |
| `/api/projects` | GET | `docs/openapi.yaml` | `backend/src/routes/project.routes.ts` | `projects.test.ts` |
| `/api/projects` | POST | `docs/openapi.yaml` | `backend/src/routes/project.routes.ts` | `projects.test.ts` |
| `/api/projects/:id` | GET | `docs/openapi.yaml` | `backend/src/routes/project.routes.ts` | `projects.test.ts` |
| `/api/projects/:id` | PUT | `docs/openapi.yaml` | `backend/src/routes/project.routes.ts` | `projects.test.ts` |
| `/api/projects/:id` | DELETE | `docs/openapi.yaml` | `backend/src/routes/project.routes.ts` | `projects.test.ts` |
| `/api/tasks` | GET | `docs/openapi.yaml` | `backend/src/routes/task.routes.ts` | `tasks.test.ts` |
| `/api/tasks` | POST | `docs/openapi.yaml` | `backend/src/routes/task.routes.ts` | `tasks.test.ts` |
| `/api/tasks/:id` | GET | `docs/openapi.yaml` | `backend/src/routes/task.routes.ts` | `tasks.test.ts` |
| `/api/tasks/:id` | PUT | `docs/openapi.yaml` | `backend/src/routes/task.routes.ts` | `tasks.test.ts` |
| `/api/tasks/:id` | DELETE | `docs/openapi.yaml` | `backend/src/routes/task.routes.ts` | `tasks.test.ts` |
| `/api/dashboard` | GET | `docs/openapi.yaml` | `backend/src/routes/dashboard.routes.ts` | `dashboard.test.ts` |

---

## 3. Database Integrity & Constraints Verification

| Constraint | Type | Definition | Enforced In | Verification |
|---|---|---|---|---|
| `users_email_key` | Unique Index | `email UNIQUE` | PostgreSQL | Prevents duplicate registration |
| `users_full_name_check` | Check | `length(trim(full_name)) >= 1` | PostgreSQL Migration | Rejects blank user names |
| `projects_name_check` | Check | `length(trim(name)) >= 1` | PostgreSQL Migration | Rejects blank project names |
| `projects_dates_check` | Check | `end_date IS NULL OR start_date IS NULL OR end_date >= start_date` | PostgreSQL Migration | Prevents end dates earlier than start dates |
| `tasks_name_check` | Check | `length(trim(name)) >= 1` | PostgreSQL Migration | Rejects blank task names |
| `tasks_project_id_fkey` | Foreign Key | `REFERENCES projects(id) ON DELETE CASCADE` | PostgreSQL Schema | Purges child tasks upon project deletion |
| `projects_owner_id_fkey` | Foreign Key | `REFERENCES users(id) ON DELETE RESTRICT` | PostgreSQL Schema | Protects account integrity |
