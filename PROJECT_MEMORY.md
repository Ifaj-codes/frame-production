# PROJECT_MEMORY.md — Frame Production Living Context

## 1. Project Brief & Product Context
- **Mission:** Complete production-ready employee attendance, work monitoring, break management, leave application, and staff performance system for **Frame Production** (video editing & production agency).
- **Core Surfaces:**
  1. Windows Desktop Application (`.exe` NSIS installer, offline queue, auto-sync, monitoring)
  2. Mobile-Responsive Admin & Developer Web Dashboard (15 management modules)
  3. Shared Node.js/TypeScript Backend & Central Relational Database (Prisma ORM)
- **Target Audience & Visitor Mode:**
  - Employees: Operate Mode (clean, single-click clock in/out, break & leave requests)
  - Admins & Developer: Operate / Review Mode (metrics, 8-tab profiles, approvals, rankings, audits)

## 2. Architecture, System Patterns & Locked Stack
- **Locked Stack:**
  - Backend: Node.js 24, Express 5, TypeScript, Prisma ORM, JWT, bcryptjs, ws (WebSockets), Multer, date-fns
  - Web Dashboard: React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Axios
  - Desktop App: Electron 34, React 19, Vite, TypeScript, Tailwind CSS, electron-builder (NSIS .exe)
  - Database: SQLite for zero-config local/offline, PostgreSQL production-ready via DATABASE_URL
- **Protected Invariants (Do-Not-Regress):**
  - Initial 21 accounts seeded (1 Developer, 3 Admins, 17 Employees).
  - Developer account is immutable and cannot be removed or downgraded by ordinary admins.
  - Offline attendance events are durable in `offline_attendance_queue.json`, timestamp-preserved, and idempotent on sync.
  - Server-side authorization on all routes (never rely solely on UI button hiding).
  - Employee privacy: Zero keystroke logging; only idle time and periodic screen captures.
  - Custom branding & yellow 3D play-button ribbon logo integrated across Web favicon, Desktop taskbar, and installer binary.

## 3. Progress Ledger & Feature Status
- [x] Phase 1: Shared Backend, Prisma Schema, Auth & Seed Script (2026-10-28)
- [x] Phase 2: Administrator & Developer Web Dashboard (15 Modules) (2026-10-28)
- [x] Phase 3: Windows Desktop App with Offline Queue & Monitoring (2026-10-28)
- [x] Phase 4: End-to-End Verification, Tests & Installer Generation (2026-10-28)
- [x] Phase 5: Custom Yellow Ribbon Play-Button Logo Integrated & Installer Rebuilt (2026-10-28)
