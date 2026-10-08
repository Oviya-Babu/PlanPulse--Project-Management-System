# PlanPulse — Project Management System

PlanPulse is a full-stack, enterprise-grade Project Management System comprising:
- **Shared Node.js + Express Backend**: Clean modular architecture, TypeScript, Prisma ORM, JWT authentication, and structured error responses.
- **PostgreSQL Database**: Relational schema with strict foreign keys, indexes, enums, and Prisma migrations.
- **Responsive Web Application**: React 18, Vite, TypeScript, TailwindCSS, and custom design tokens based on modern shadcn/ui patterns.
- **Cross-Platform Mobile Application**: React Native, Expo, TypeScript, and React Native Paper (Material Design 3) with secure token storage.

---

## Architecture Overview

```
                               ┌────────────────────────┐
                               │   PostgreSQL Database  │
                               │ (pms_dev / pms_test)   │
                               └───────────▲────────────┘
                                           │
                                           │ Prisma ORM
                                           │
                               ┌───────────┴────────────┐
                               │   Node.js / Express    │
                               │   API Backend (4000)   │
                               └─────▲────────────▲─────┘
                                     │            │
            REST API (JSON / JWT)    │            │  REST API (JSON / JWT)
     ┌───────────────────────────────┘            └──────────────────────────────┐
     │                                                                           │
┌────┴──────────────────────────┐                           ┌────────────────────┴───────────┐
│       React Web App           │                           │      React Native Mobile       │
│  (Vite + Tailwind @ 5173)     │                           │     (Expo + Paper Theme)       │
└───────────────────────────────┘                           └────────────────────────────────┘
```

---

## Repository Structure

```
.
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── app.ts            # Express application factory
│   │   ├── server.ts         # Server lifecycle & graceful shutdown
│   │   ├── config.ts         # Environment validation (Zod)
│   │   ├── errors/           # Standard error hierarchy
│   │   ├── middleware/       # Helmet, CORS, RequestId, Logging, ErrorHandler
│   │   ├── routes/           # REST route definitions
│   │   ├── controllers/      # Route controllers
│   │   └── lib/              # Prisma client & Pino logger
│   ├── prisma/               # Schema and database migrations
│   └── tests/                # Vitest integration tests
├── web/                      # React frontend
│   ├── src/
│   │   ├── components/ui/    # Reusable design system primitives
│   │   ├── components/layout/# AppShell & Navbar
│   │   ├── pages/            # Dashboard, Projects, Tasks
│   │   └── lib/              # Design tokens, Axios client, utility helpers
├── mobile/                   # React Native mobile app
│   ├── src/
│   │   ├── navigation/       # React Navigation bottom tabs
│   │   ├── screens/          # Dashboard, Projects, Tasks screens
│   │   ├── theme/            # Shared tokens mapped to MD3 Paper theme
│   │   ├── storage/          # SecureStore JWT token storage
│   │   └── api/              # Axios client with interceptors
├── docker-compose.yml        # PostgreSQL container configuration
├── THIRD_PARTY_NOTICES.md    # Open-source licensing notices
└── package.json              # Monorepo task orchestration
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or v24
- **PostgreSQL**: v16+ (or WSL2 / Docker)

### 1. Database Setup & Local Database (Windows + WSL)
PostgreSQL 16 runs inside Ubuntu 24.04 WSL2 with mirrored networking enabled via `~/.wslconfig` (`[wsl2]\nnetworkingMode=mirrored`), exposing port `5432` directly on `127.0.0.1` and `localhost`.

**Starting PostgreSQL after a system reboot:**
```bash
wsl -u root -d Ubuntu-24.04 service postgresql start
```

Run database migrations:
```bash
npm --prefix backend run db:migrate:deploy
```

### 2. Running Backend (Node.js API)
```bash
npm run dev:backend
# API listening on http://0.0.0.0:4000/api
# Health endpoint: http://localhost:4000/api/health
```

### 3. Running Web Application
```bash
npm run dev:web
# Web app available at http://localhost:5173
```

### 4. Running Mobile Application (Mobile Quick Start)
```bash
npm run dev:mobile
```

#### Android Emulator Setup:
- Ensure Android Studio emulator is running.
- In `mobile/.env`, set:
  ```env
  EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:4000"
  ```
- In the Expo terminal, press **`a`** to open the app on Android.

#### Physical Phone Setup (Expo Go):
- Install the **Expo Go** app from Google Play Store (ensure it supports Expo SDK 52).
- Connect your phone to the same Wi-Fi network as your computer.
- Find your computer's local IP (e.g. `192.168.0.111`).
- In `mobile/.env`, set:
  ```env
  EXPO_PUBLIC_API_BASE_URL="http://192.168.0.111:4000"
  ```
- Scan the QR code displayed in the Expo CLI terminal with the Expo Go app.

#### Windows Firewall for Port 4000:
To allow physical phones on your Wi-Fi to reach the backend API on port 4000, ensure inbound TCP port 4000 is allowed in Windows Defender Firewall (run in elevated PowerShell if needed):
```powershell
New-NetFirewallRule -DisplayName "PMS Backend API 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

---

## Design System Tokens

Both web and mobile share unified design tokens defined in `web/src/lib/tokens.ts` and `mobile/src/theme/index.ts`:

- **Primary**: `#2563EB` (Blue 600)
- **Background**: `#F8FAFC` (Slate 50)
- **Surface**: `#FFFFFF` (White)
- **Status Not Started**: `#64748B` (Slate 500)
- **Status In Progress**: `#D97706` (Amber 600)
- **Status Completed**: `#16A34A` (Emerald 600)
- **Priority Low**: `#0284C7` (Sky 600)
- **Priority Medium**: `#D97706` (Amber 600)
- **Priority High**: `#DC2626` (Red 600)
