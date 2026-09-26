# 🧰 KisanSetu — SIH 2026 Presentation & Demo Backup Checklist

This operational checklist ensures the demo runs flawlessly under all presentation constraints, network conditions, or hardware switches.

---

## 1. Demo Credentials & Quick Access Reference

The Login screen features **1-Click Quick Demo Access** cards for instant sign-in:

| Role | 1-Click Card | Manual Username | Manual Password | Primary Live URL | Key Feature to Demonstrate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Farmer** | Green "Farmer" card | `farmer1` | `farmer1` | `http://localhost:5173/farmer` | 21st.dev Animated Card, slot booking, digital QR pass |
| **Active Farmer** | N/A (Direct login) | `farmer2` | `farmer2` | `http://localhost:5173/farmer/procurement` | 21st.dev Modern 9-stage active procurement timeline |
| **Officer** | Blue "Officer" card | `officer1` | `officer1` | `http://localhost:5173/officer` | 21st.dev Dashboard Sidebar, queue management, weighment & QC |
| **Admin** | Purple "Admin" card | `admin1` | `admin1` | `http://localhost:5173/admin` | 21st.dev ProgressMetricCards, sparklines, simulation engine |

---

## 2. Cold-Start Commands (From Fresh Terminal)

### Option A: 1-Command Root Launch (Recommended)
Open a terminal in the project root (`c:\Users\yesvi\OneDrive\Desktop\SIH`):
```bash
npm run dev
```
*This starts both the Node.js backend (port 3001) and the Vite frontend (port 5173) concurrently.*

---

### Option B: Two-Terminal Clean Startup (Standard)

#### Terminal 1 — Backend API Server (Port 3001)
```powershell
cd c:\Users\yesvi\OneDrive\Desktop\SIH\backend
npm run dev
```
*Expected output: `KisanSetu Backend running on port 3001`*

#### Terminal 2 — Frontend Dev Server (Port 5173)
```powershell
cd c:\Users\yesvi\OneDrive\Desktop\SIH\frontend
npm run dev
```
*Expected output: `Local: http://localhost:5173/`*

---

### Option C: Production Bundle Execution (Zero Build Dependency)
If Vite hot-reloading is not needed during presentation:
```powershell
cd c:\Users\yesvi\OneDrive\Desktop\SIH\frontend
npm run build
npm run preview
```
*Runs the production pre-compiled bundle on port 4173.*

---

## 3. Environment & Configuration Check

- **Node.js Version:** &ge; 18.0.0 (Tested on Node v20/v24)
- **Root Directory:** `c:\Users\yesvi\OneDrive\Desktop\SIH`
- **Frontend URL:** `http://localhost:5173`
- **Backend API URL:** `http://localhost:3001`
- **Vite Proxy:** Confirmed active in `vite.config.ts` mapping `/api` &rarr; `http://localhost:3001`.

---

## 4. Visual Verification & Backup Screenshot Assets

High-resolution visual backups of all screens across Mobile, Tablet, and Desktop viewports are pre-rendered in:
`C:\Users\yesvi\.gemini\antigravity-ide\brain\e533b224-a978-4dfa-b784-b8fe1f2acd97\phase12_screenshots\`

1. `farmer_dashboard_desktop_1440x900.png` — Farmer dashboard with 21st.dev Animated Card
2. `farmer_dashboard_mobile_390x844.png` — Mobile layout with 21st.dev Bottom Nav Bar
3. `farmer_progress_active_desktop_1440x900.png` — 21st.dev Modern Timeline with active milestones
4. `farmer_progress_active_mobile_390x844.png` — Mobile timeline with glowing pulse indicators
5. `officer_dashboard_desktop_1440x900.png` — 21st.dev Dashboard Sidebar & Operations Console
6. `officer_dashboard_mobile_390x844.png` — High-density mobile queue console
7. `admin_dashboard_desktop_1440x900.png` — 21st.dev ProgressMetricCards with live sparkline curves
8. `admin_dashboard_tablet_768x1024.png` — Tablet command centre with clean 2x2 grid

---

## 5. Emergency Recovery Playbook

### Scenario 1: Port 3001 or 5173 is Busy / Already in Use
If another process holds port 3001 or 5173, kill it in PowerShell:
```powershell
# Find and terminate process on port 3001 (Backend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

# Find and terminate process on port 5173 (Frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
```
Then restart `npm run dev`.

---

### Scenario 2: Corrupted Browser Session / Redirect Loops
If someone was previously logged in as an unexpected role or localStorage got corrupted:
1. Open Chrome DevTools (`F12`).
2. Navigate to **Application** &rarr; **Local Storage** &rarr; `http://localhost:5173`.
3. Click the clear icon (or execute in console: `localStorage.clear(); window.location.href = '/login';`).
4. Use the 1-click **Quick Demo Access** cards to re-authenticate cleanly.

---

### Scenario 3: Complete Offline Mandi Demo (No Internet at Venue)
- **KisanSetu has ZERO external cloud API dependencies.**
- The backend runs 100% locally on localhost without requiring internet access.
- All icons (Lucide React) and fonts are bundled inside node_modules and Vite assets.
- If venue Wi-Fi fails completely, open `http://localhost:5173` on localhost and proceed through the demo without disruption.

---

### Scenario 4: Pitch Deck / Slide Crash
Keep `SIH_DEMO_SCRIPT.md` open on a secondary device (phone or tablet) to guide presentation timing if slides fail or evaluator asks to jump directly into the live software.
