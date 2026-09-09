# 🌾 KisanSetu — Smart Procurement & Queue Management Platform

> **"Smart Procurement. Less Waiting. Complete Transparency."**

A full-stack digital platform that transforms the agricultural procurement experience for Indian farmers by providing **smart slot booking**, **live queue tracking**, **digital tokens**, **transparent procurement progress**, and **real-time payment status** — all in one app.

Built for **Smart India Hackathon (SIH) 2026**.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Demo Credentials](#-demo-credentials)
- [User Flows](#-user-flows)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Impact Metrics](#-impact-metrics)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🎯 Problem Statement

Farmers across India face significant challenges when selling produce at government procurement centres:

| Problem | Impact |
|---------|--------|
| **Long unpredictable queues** | Farmers wait 4-8 hours with no visibility |
| **No scheduling system** | Blind visits lead to overcrowding |
| **Lack of transparency** | No real-time status on procurement or payment |
| **Information asymmetry** | Farmers don't know MSP rates, centre congestion, or payment timelines |
| **No digital records** | Paper-based tracking prone to errors and delays |

## 💡 Solution

**KisanSetu** digitizes the entire procurement journey:

```
Registration → Produce Details → Centre Selection → Smart Slot Booking
    → Digital Token → Live Queue → Gate Entry → Weighing → Quality Check
        → Procurement → Payment/DBT → Completion
```

Instead of farmers travelling blindly to crowded centres and waiting for hours, KisanSetu provides a **scheduled slot**, **digital token**, **live queue position**, **procurement tracking**, and **transparent payment status**.

---

## ✨ Features

### 👨‍🌾 Farmer Portal (Mobile-First)
- **Smart Slot Booking** — AI-recommended slots based on congestion, distance, and wait time
- **Digital Token** — QR-ready token displayed on phone for gate entry
- **Live Queue Tracking** — Real-time position and ETA with auto-refresh
- **Procurement Timeline** — Visual 9-step progress tracker (Booked → Completed)
- **Payment Status** — Gross amount, deductions, net amount, DBT reference
- **Notifications** — Real-time alerts for slot confirmation, queue updates, payment
- **Bilingual UI** — English / Hindi toggle across all screens

### 👮 Officer Portal (Desktop)
- **Queue Management** — Live queue view, call-next functionality
- **Procurement Processing** — Step-by-step state transitions with inline forms
  - Weighing data entry (gross weight, tare weight, net weight)
  - Quality check (moisture %, grade, foreign matter, remarks)
  - Payment initiation and completion
- **Farmer Directory** — Search and view all registered farmers

### 🔑 Admin Portal (Dashboard)
- **KPI Dashboard** — 6 real-time metric cards (farmers, bookings, queue, wait time, completions, payments)
- **Centre Monitoring** — Live congestion, queue length, utilization bars for all centres
- **Analytics** — 7 interactive Recharts charts (registrations, bookings, wait time, queue, utilization, procurement, payments)
- **Payment Monitoring** — Filter by status, process pending payments
- **Slot Management** — View and manage slot capacity by centre and date
- **Reports** — Daily/weekly/monthly summaries with impact metrics
- **Live Demo** — One-click demo simulator that auto-advances through all procurement states

### 🤖 AI Assistant
- **KisanSetu AI** — Pattern-matching bilingual query engine
- Answers questions about queue status, MSP rates, payment status, centre recommendations

### 🌐 Internationalization
- **English & Hindi** — 80+ translation keys covering all UI text
- Persisted language preference

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Routing** | React Router v6 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Build Tool** | Vite |
| **Backend** | Node.js + Express |
| **Auth** | JWT (jsonwebtoken) |
| **Database** | In-memory store (mock data for MVP) |
| **Language** | TypeScript (shared types) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (tested on v24.20.0)
- **npm** v8+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd SIH

# Install all dependencies
npm install              # Root (concurrently)
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running the App

```bash
# Option 1: Run both together (from root)
npm run dev

# Option 2: Run separately
# Terminal 1 — Backend
cd backend
npm run dev              # Starts on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev              # Starts on http://localhost:5173
```

### Environment Variables

Create `backend/.env`:
```env
PORT=3001
JWT_SECRET=kisansetu-dev-secret-change-in-production
NODE_ENV=development
```

---

## 📁 Project Structure

```
SIH/
├── shared/                    # Shared TypeScript types & utilities
│   ├── types/
│   │   ├── index.ts           # Enums, interfaces (User, Farmer, Centre, etc.)
│   │   └── api.ts             # API request/response types
│   └── utils/
│       └── index.ts           # Formatters, color helpers
│
├── backend/                   # Express API server
│   └── src/
│       ├── server.ts          # Entry point, route mounting
│       ├── data/
│       │   ├── seedData.ts    # 100+ realistic seed records
│       │   └── store.ts       # In-memory CRUD data store
│       ├── middleware/
│       │   ├── auth.ts        # JWT auth + role guards
│       │   └── errorHandler.ts
│       └── routes/
│           ├── auth.ts        # Login, register, /me
│           ├── farmers.ts     # Farmer CRUD + produce
│           ├── centres.ts     # Centre listing + stats
│           ├── slots.ts       # Available, recommended, book, cancel
│           ├── queue.ts       # Queue position, ETA, call-next
│           ├── procurement.ts # Full 9-state machine transitions
│           ├── payments.ts    # Payment CRUD + process
│           ├── notifications.ts
│           ├── analytics.ts   # KPIs, charts, centre comparison
│           ├── demo.ts        # Live demo simulator
│           └── ai.ts          # AI query engine
│
├── frontend/                  # React + Vite app
│   └── src/
│       ├── main.tsx           # Entry point
│       ├── App.tsx            # Router with lazy loading
│       ├── index.css          # Tailwind + custom animations
│       ├── context/
│       │   ├── AuthContext.tsx # Auth state management
│       │   └── LanguageContext.tsx  # i18n (EN/HI)
│       ├── services/
│       │   └── api.ts         # Axios client + all API functions
│       └── pages/
│           ├── Login.tsx
│           ├── farmer/        # 10 farmer pages
│           ├── officer/       # 4 officer pages
│           └── admin/         # 6 admin pages
│
├── package.json               # Root workspace config
└── .env.example
```

---

## 🔐 Demo Credentials

| Role | Username | Password | Portal |
|------|----------|----------|--------|
| 👨‍🌾 Farmer | `farmer1` | `farmer1` | Mobile dashboard, token, queue, procurement |
| 👮 Officer | `officer1` | `officer1` | Queue management, procurement processing |
| 🔑 Admin | `admin1` | `admin1` | KPI dashboard, analytics, centre monitoring |

> Additional farmers: `farmer2` through `farmer10` (password = username)

---

## 🔄 User Flows

### Farmer Journey
```
Login → Register Produce → Select Centre → Book Smart Slot
  → Receive Digital Token → Track Live Queue Position
  → Procurement Progress (9 steps) → Payment via DBT → Done!
```

### Officer Workflow
```
Login → View Queue → Call Next Farmer → Mark Arrived
  → Record Weighing → Quality Check → Approve Procurement
  → Initiate Payment → Complete
```

### Admin Operations
```
Login → Monitor KPIs → Check Centre Congestion → View Analytics
  → Manage Slots → Monitor Payments → Generate Reports
  → Run Live Demo
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with phone/password |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/farmers/me` | Farmer profile + produce + token |
| `GET` | `/api/farmers` | List all farmers |
| `POST` | `/api/farmers/produce` | Register produce |
| `GET` | `/api/centres` | List centres with live stats |
| `GET` | `/api/slots/available` | Available slots |
| `GET` | `/api/slots/recommended` | AI-recommended slots |
| `POST` | `/api/slots/book` | Book a slot |
| `GET` | `/api/queue/position` | Farmer's queue position + ETA |
| `GET` | `/api/queue/centre/:id` | Centre queue list |
| `POST` | `/api/queue/next` | Call next farmer |
| `GET` | `/api/procurement/current` | Active procurement |
| `PUT` | `/api/procurement/:id/status` | Transition state |
| `GET` | `/api/payments/current` | Current payment |
| `PUT` | `/api/payments/:id/process` | Process payment |
| `GET` | `/api/notifications` | User notifications |
| `GET` | `/api/analytics/kpis` | Dashboard KPIs |
| `GET` | `/api/analytics/charts/:type` | Chart data |
| `POST` | `/api/ai/query` | AI assistant query |
| `POST` | `/api/demo/start` | Start live demo |
| `GET` | `/api/health` | Health check |

---

## 🏗 Architecture

```
┌──────────────────┐     ┌──────────────────┐
│   React Frontend │────▶│   Express API    │
│   (Vite :5173)   │ /api│   (:3001)        │
│                  │◀────│                  │
│  • Auth Context  │     │  • JWT Auth      │
│  • Lang Context  │     │  • Role Guards   │
│  • Lazy Routes   │     │  • State Machine │
│  • Recharts      │     │  • In-Memory DB  │
│  • Tailwind CSS  │     │  • Seed Data     │
└──────────────────┘     └──────────────────┘
```

### Procurement State Machine
```
BOOKED → ARRIVED → GATE_ENTRY → WEIGHING → QUALITY_CHECK
  → PROCUREMENT → PAYMENT_PENDING → PAYMENT_PROCESSING → COMPLETED
```
Each transition is validated (sequential only) and creates appropriate records (weighing data, quality checks, payments, notifications, audit logs).

### Smart Slot Recommendation Algorithm
Slots are scored based on:
- **Congestion Level** (40% weight) — Lower congestion = higher score
- **Available Capacity** (30% weight) — More availability = higher score
- **Time Preference** (20% weight) — Morning slots preferred
- **Distance** (10% weight) — Closer centres preferred

---

## 📊 Impact Metrics

> *Prototype targets — not measured results*

| Metric | Target Reduction/Increase |
|--------|---------------------------|
| ⬇️ Waiting Time | 42% reduction |
| ⬇️ Queue Congestion | 35% reduction |
| ⬇️ Unplanned Visits | 50% reduction |
| ⬆️ Slot Utilization | 28% increase |
| ⬆️ Digital Bookings | 65% increase |
| ⬆️ Payment Visibility | 90% coverage |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#16a34a` (Green-600) |
| Secondary | `#2563eb` (Blue-600) |
| Warning | `#f59e0b` (Amber-500) |
| Danger | `#ef4444` (Red-500) |
| Font | Inter (Google Fonts) |
| Radius | `rounded-2xl` (16px) |
| Shadows | Layered soft shadows |
| Animations | fadeIn, slideUp, scaleIn, pulse |

---

## 📝 License

This project is built for Smart India Hackathon 2026. All rights reserved.

---

<div align="center">

**Built with ❤️ for Indian Farmers**

🌾 KisanSetu — Smart Procurement. Less Waiting. Complete Transparency. 🌾

*SIH 2026 | Government of India Initiative*

</div>
