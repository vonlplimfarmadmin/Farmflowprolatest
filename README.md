# FarmFlow Pro — Broiler-Breeder Farm Management System

[![Node Version](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

**FarmFlow Pro** is an enterprise-grade poultry broiler-breeder farm management and operations suite designed for commercial poultry breeding farms, hatcheries, and integrators. It covers flock lifecycle tracking, daily flockman data collection, egg grading, ESRRR delivery receipts, hatchery yield summaries, feed inventory, vaccination and veterinary health programs, biosecurity compliance, and official multi-format reporting.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [System Architecture & Modules](#-system-architecture--modules)
- [Tech Stack](#-tech-stack)
- [Installation & Getting Started](#-installation--getting-started)
- [User Roles & Permissions (RBAC)](#-user-roles--permissions-rbac)
- [Spreadsheet & Batch Data Import/Export](#-spreadsheet--batch-data-importexport)
- [Keyboard Shortcuts & Power-User Tools](#-keyboard-shortcuts--power-user-tools)
- [Project Structure](#-project-structure)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Build & Deployment](#-build--deployment)
- [License](#-license)

---

## 🌟 Key Features

### 1. Executive Farm Dashboard & KPIs
- Live bird census (active female and male counts) across all production houses.
- Daily egg collection totals with automatic Hen-Day % and Hatching Egg (HE) % calculations.
- Mortality and culling monitoring against breed standard limits.
- Biosecurity status and low feed stock indicators.

### 2. Flockman Daily Field Operations
- Purpose-built interface optimized for mobile and rugged farm tablets.
- Fast morning/afternoon egg collection entry by grade.
- Daily bird mortality & culls recording by sex with automatic population balance reconciliation.
- Feed consumption inputs in **kilograms (kg)** with automatic conversion to per-bird intake (**g/bird/day**) and standard 50-kg bag equivalents.
- Quick **"Fill Guide Target"** / **"Apply Guide Presets"** based on active flock age and breed benchmark curves.

### 3. Egg Production & Grading
- Categorization into Hatching Eggs (HE), Table/Commercial Eggs, Cracked, Double Yolk, Small, Dirty, and Rejects.
- Automatic Hen-Day % (`Total Eggs / Active Females × 100`) and Hatching Egg % calculations.
- House-by-house comparison and historical trends.
- Weekly egg weight surveillance against standard breed progression curves.

### 4. ESRRR Egg Delivery & Hatchery Summaries
- **Egg Stock Receipt / Rejection Report (ESRRR)**: Tracks egg dispatches to external or parent hatcheries with lot/batch tracing, carrier vehicle details, breakages in transit, and receipt confirmation.
- **Hatchery Incubation Records**: Records fertility %, hatch of total %, hatch of fertile %, grade A chick output, and cull counts for dispatched egg batches.

### 5. Feed Inventory & Ration Allocation
- Silo and warehouse feed stock tracking across formulas (CSC 1, CSC 2, CGC, PDC, BLC 1, BLC 2, BLC 3, BMCC, BMCR, CBB).
- Batch/lot receipts with bag weight calculations and supplier documentation.
- Live depletion logging with automatic stock reconciliation and critical low-stock alerts.

### 6. Biosecurity, Medicine & Vaccine Program
- Vaccination and medication scheduling by flock age week and target disease.
- Biologicals pharmacy inventory tracking doses per unit, lot numbers, manufacturers, and expiration dates.
- **Batch Upload Option**: Bulk import biological and health items via Excel (`.xlsx`, `.xls`) or CSV (`.csv`) with automatic category and unit normalization, live preview, row deletion, and inventory merging.
- Downloadable pre-populated spreadsheet templates and current inventory exports.
- Daily biosecurity protocol checklist with quick batch-verification.

### 7. Body Weight & Flock Uniformity Surveillance
- Weekly sampling of female and male breeders.
- Automatic calculation of Average Weight (g), Coefficient of Variation (CV %), Uniformity %, and deviation from target breed curve.
- Visual warning indicators for under-weight or over-weight flocks.

### 8. Farm Profile & Master Breed Standards
- Configurable standard curves for:
  - Vaccination & Immunization Schedules
  - Feed Allocation Guides (g/bird/day by sex)
  - Hen-Day Production % & Hatching Egg % Curves
  - Male & Female Body Weight Standards
  - Egg Weight Progression Standards
- Master workbook and individual standard bulk Excel/CSV batch import/export.
- Company branding customization (logo, farm name, TIN, address, contact).

### 9. Multi-Format Dynamic Reports
- **Official Excel Workbooks (`.xlsx`)**: Formatted reports complete with company letterhead, metadata, column widths, and summary rows using `xlsx`.
- **Formal PDF Reports**: Formatted operational logs and delivery receipts using `jspdf` and `jspdf-autotable`.
- **PowerPoint Presentation Deck (`.pptx`)**: Executive slide generation using `pptxgenjs`.
- **Messenger Quick Reports**: Formatted textual snapshot for instant copy-pasting to Telegram, Viber, WhatsApp, or SMS.

---

## 🏗️ System Architecture & Modules

```
┌─────────────────────────────────────────────────────────────┐
│                       FarmFlow Pro                          │
├──────────────────────────────┬──────────────────────────────┤
│ Core Views                   │ Supporting Infrastructure    │
│  ├── Dashboard Overview      │  ├── Role-Based Auth Context │
│  ├── Flockman Field View     │  ├── Offline/Local State     │
│  ├── Flock Management        │  ├── Firestore Sync Proxy    │
│  ├── Egg Production          │  ├── Command Palette (Cmd+K) │
│  ├── ESRRR Egg Delivery      │  ├── Keyboard Hotkeys Modal  │
│  ├── Feed Inventory          │  ├── Cross-Platform Haptics  │
│  ├── Medicine & Vaccines     │  ├── Toast Notification Bus  │
│  ├── Body Weight Sampling    │  └── Excel/CSV Parser Engine │
│  ├── Biosecurity Compliance  │                              │
│  ├── Farm Profile & Curves   │                              │
│  └── Dynamic Reports Engine  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Vite 6
- **Icons & UI Components**: Lucide React, Framer Motion
- **Charts & Data Visualization**: Recharts
- **Spreadsheet & Document Export**: `xlsx` (SheetJS), `jspdf`, `jspdf-autotable`, `pptxgenjs`, `qrcode.react`
- **Backend / Dev Server**: Express 4, `tsx`, Node.js (with proxy routes)
- **AI Integrations**: Server-side Google Gemini 2.5 API integration capability via `@google/genai`

---

## 🚀 Installation & Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or higher

### 1. Clone the repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables (optional)
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Ensure client-facing environment variables are prefixed with `VITE_`.

### 4. Start the development server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 5. Build for production
```bash
npm run build
npm start
```

---

## 👥 User Roles & Permissions (RBAC)

The system includes granular, role-based access control configured in `src/types/index.ts`:

| Role | Permissions |
|---|---|
| **Super Admin / Owner** | Full unrestricted access: user approval, financial reports, delete privileges, system settings, standards editing. |
| **Farm Manager** | Full operational control: approve logs, manage inventory, view reports, edit standards, manage flocks. |
| **Flockman / Lead** | Daily field operations: egg collection, mortality recording, feed intake logging, medication administration. |
| **Veterinarian / Biosecurity Officer** | Health oversight: manage pharmacy stock, log administrations, verify biosecurity, review body weight. |
| **Hatchery Manager** | Delivery & Incubation oversight: log ESRRR receipts, manage incubation summaries, view production trends. |
| **Inventory Clerk** | Stock control: record feed deliveries, track warehouse inventory, monitor consumption logs. |
| **Auditor / Viewer** | Read-only inspection of reports, audit logs, and flock production metrics. |

---

## 📊 Spreadsheet & Batch Data Import/Export

### Batch Upload for Health & Biological Items
Located under **Medicine & Vaccine Program > Add New Health Item > Batch Upload**:
1. Download sample template in **Excel (.xlsx)** or **CSV (.csv)** format.
2. Fill columns: `Product Name`, `Category` (*Vaccine, Antibiotic, Vitamins, Supplement, Disinfectant, Dewormer, Paraphernalias*), `Packaging Unit`, `Doses Per Unit`, `Initial Stock Units`, `Manufacturer`, `Expiry Date`, `Dosage / Route`, and `Notes`.
3. Drop the file into the upload zone.
4. Review rows in the interactive preview table (with category filters and single-row removal).
5. Choose whether to **merge with existing inventory** or append as new items.
6. Click **Import Health Items** to commit.

### Master Farm Standards Batch Upload
Located under **Farm Profile > Batch Upload Standards**:
- Upload master 5-sheet workbooks or single standards for Vaccination Timelines, Feed Guides, Henday Curves, Body Weights, and Egg Weights.
- Provides immediate format validation, row error checks, and download templates.

---

## ⌨️ Keyboard Shortcuts & Power-User Tools

Press `?` anywhere in the app (outside text inputs) to view the shortcut cheat sheet:

| Shortcut | Action |
|---|---|
| <kbd>Cmd</kbd> + <kbd>K</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Universal Command Palette |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts Modal |
| <kbd>D</kbd> | Navigate to Executive Dashboard |
| <kbd>E</kbd> | Navigate to Egg Production |
| <kbd>F</kbd> | Navigate to Feed Inventory |
| <kbd>V</kbd> | Navigate to Medicine & Biologicals |
| <kbd>R</kbd> | Navigate to Dynamic Reports |
| <kbd>M</kbd> | Open Messenger Quick Report Modal |

---

## 📁 Project Structure

```
├── dist/                      # Production build output
├── public/                    # Static assets, icons, manifest
├── src/
│   ├── components/
│   │   ├── auth/              # Login screen, register modal, role switcher
│   │   ├── bodyWeight/        # Bird weight sampling & uniformity calculations
│   │   ├── common/            # Command palette, modals, toasts, role badges
│   │   ├── dashboard/         # Executive farm dashboard & KPI cards
│   │   ├── delivery/          # ESRRR delivery records & hatchery incubation summaries
│   │   ├── eggProduction/     # Egg collection, grading, and Hen-Day % logs
│   │   ├── farmProfile/       # Farm details, logo upload, standards batch upload
│   │   ├── feed/              # Feed inventory, rations, and stock receipts
│   │   ├── flock/             # Flock creation, houses, and bird census
│   │   ├── flockman/          # Flockman daily field recording interface
│   │   ├── layout/            # Navbar, sidebar, mobile navigation, drawers
│   │   ├── medicine/          # Biologicals inventory, batch upload, administration logs
│   │   ├── mortality/         # Daily mortality, rejects, and depletion records
│   │   ├── reports/           # Dynamic report generator (Excel, PDF, PPTX)
│   │   └── settings/          # Biosecurity compliance, audit trails, user management
│   ├── context/
│   │   └── FarmContext.tsx    # Central state store, actions, and persistence logic
│   ├── data/
│   │   └── initialData.ts     # Pre-seeded flock data, standard curves, initial stock
│   ├── types/
│   │   └── index.ts           # Central TypeScript interfaces, enums, and types
│   ├── utils/
│   │   ├── healthBatchUploadUtils.ts # Excel/CSV parsing & templates for biologicals
│   │   ├── standardsImportExport.ts  # Master standards import/export parser
│   │   ├── reportExportUtils.ts      # Excel report styling and metadata generator
│   │   ├── pdfReportUtils.ts         # PDF generation routines
│   │   └── platform.ts               # Platform detection & haptic feedback
│   ├── App.tsx                # App root, routing, and global listeners
│   ├── index.css              # Tailwind CSS imports & custom styling
│   └── main.tsx               # Client entry point
├── server.ts                  # Node.js Express server with Vite middleware integration
├── vite.config.ts             # Vite configuration with React & Tailwind plugins
├── metadata.json              # Applet identity & major capability configuration
└── package.json               # Dependencies and scripts
```

---

## ⚙️ Build & Verification

```bash
# Type check and lint
npm run lint

# Build client and server bundle
npm run build

# Preview build locally
npm run preview
```

---

## 📄 License

Proprietary — Developed for commercial poultry broiler-breeder operations. All rights reserved.
