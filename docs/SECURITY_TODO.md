# Security Implementation & Hardening TODO (Slice 6)

This document tracks security and hardening tasks that are deferred to **Slice 6 (Security, Audit & Production Hardening)** per PRD §40.1 and implementation plan requirements. Every item listed here is mandatory prior to production release.

---

## 1. Rate Limiting (AUTH-013, SEC-001)
- [ ] Enforce login rate limit: maximum 10 failed login attempts per IP / email per 15-minute sliding window (returns 429 `RATE_LIMITED` with `Retry-After` header).
- [ ] Enforce registration rate limit: maximum 10 account creation requests per IP per 1-hour window.
- [ ] Implement Redis-backed or robust memory store for rate limiters across clustered instances.

## 2. Security Headers & CORS Tuning Audit (SEC-004, SEC-005)
- [ ] Review Helmet Content Security Policy (CSP) directives to ensure zero inline scripts in production bundles.
- [ ] Restrict `CORS_ORIGIN` strictly to the verified production web domain (disallow wildcard `*`).
- [ ] Verify `Strict-Transport-Security` (HSTS) with `includeSubDomains; preload` for HTTPS enforcement.
- [ ] Enforce `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.

## 3. Comprehensive Security Test Matrices (SEC-010..SEC-015)
- [ ] **Cross-User Authorization Test Matrix**:
  - Verify User A cannot read, update, or delete User B's projects (enforce 404 response to avoid ID existence leakage).
  - Verify User A cannot read, create, update, or complete tasks within User B's projects.
  - Verify User A cannot access User B's dashboard metrics.
- [ ] **SQL Injection Defense Matrix**:
  - Test parameterized query safety against SQL payload injections (`' OR 1=1 --`, `UNION SELECT`, etc.) in search and filter endpoints.
  - Verify Prisma ORM executes parameterized queries for all database interactions.
- [ ] **NoSQL / Object Injection & XSS Matrix**:
  - Validate all text fields sanitize against `<script>` and HTML injection before rendering.

## 4. Secret & Credential Scanning (SEC-020, GIT-003)
- [ ] Run automated secret scanning tool (e.g., `gitleaks` or `trufflehog`) across the complete Git commit history.
- [ ] Confirm no secrets, `.env` files, keystores, or private tokens are present in tracked files.
- [ ] Verify logger credential redaction (Pino redacting passwords, hashes, tokens, auth headers).

## 5. Production Database Hardening (SEC-030)
- [ ] Create dedicated non-superuser PostgreSQL role for application queries (revoke `SUPERUSER`).
- [ ] Bind PostgreSQL connection listener strictly to local socket or private VPC CIDR block.
- [ ] Configure SSL connection mode (`sslmode=require`) between backend application instances and managed PostgreSQL.
- [ ] Implement database connection pooling and query timeout bounds.
