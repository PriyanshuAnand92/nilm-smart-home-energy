<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# NILM Smart Home Energy Monitor & Research Lab

A full-stack, research-grade **Non-Intrusive Load Monitoring (NILM)** dashboard with Samsung SmartThings-style UI, real disaggregation analytics, and an Express backend API — supporting **31 homes** across UK-DALE, REFIT, and REDD datasets.

---

## 🏠 Features

| Feature | Description |
|---|---|
| **31 Real Research Homes** | UK-DALE (5), REFIT (20), REDD (6) with per-house profiles |
| **Live Disaggregation** | Fridge, Washing Machine, Kettle with GT + CNN estimates |
| **Smart Home Dashboard** | Device cards, power meter, budget tracker, forecasts |
| **Cost Calculator** | Indian slab tariff (telescopic), custom budgets, carbon emissions |
| **NILM Research Lab** | Cross-dataset benchmarks, model comparison, training curves |
| **Interactive Inference Runner** | Calls backend API (falls back to offline simulation) |
| **Report Export** | PDF + CSV download of energy & cost summaries |
| **11 Indian Languages** | Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, English |
| **Custom CSV Upload** | Validate and analyse your own 8-second meter data |
| **Express Backend API** | 8 REST endpoints for timeseries, inference, metrics, export |

---

## 🚀 Run Locally

**Prerequisites:** Node.js v18+

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY if needed
```

### 3. Start Frontend (Vite dev server on port 3000)

```bash
npm run dev
```

### 4. Start Backend API (Express on port 3001) — Optional

The frontend works fully in offline mode without the backend. Starting the backend unlocks **live computed metrics** in the Inference Runner.

```bash
node server.js
```

Or run both together:

```bash
npm run dev:all
```

---

## 📡 Backend API Endpoints

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/houses` | List all 31 supported homes |
| `GET` | `/timeseries/:houseId` | 288-point 24h timeseries for a house |
| `GET` | `/summary/:houseId` | Energy & appliance breakdown summary |
| `GET` | `/benchmark` | Full benchmark matrix (31 homes × 3 appliances × 3 models) |
| `GET` | `/export/csv/:houseId` | Download timeseries as CSV |
| `POST` | `/infer` | Run NILM disaggregation inference |
| `POST` | `/metrics` | Compute evaluation metrics from arrays |
| `POST` | `/upload` | Validate uploaded CSV content |

### Example: Run Inference

```bash
curl -X POST http://localhost:3001/api/infer \
  -H "Content-Type: application/json" \
  -d '{"houseId":"ukdale_house1","appliance":"kettle","model":"seq2point"}'
```

---

## 🏠 Supported Houses

### UK-DALE (5 houses) — London, UK
| ID | Occupants | Appliances | Days |
|---|---|---|---|
| `ukdale_house1` | 4 (Primary Train) | Fridge, WM, Kettle | 656 |
| `ukdale_house2` | 2 (Held-Out) | Fridge, WM, Kettle | 240 |
| `ukdale_house3` | 1 (Held-Out) | Fridge, Kettle | 273 |
| `ukdale_house4` | 2 (Eval) | Fridge, WM, Kettle | 458 |
| `ukdale_house5` | 4 (Eval) | Fridge, WM, Kettle | 186 |

### REFIT (20 houses) — Loughborough, UK
Houses 1–20 with 1–6 occupants, all with fridge + kettle (WM varies). Cross-dataset transfer target.

### REDD (6 houses) — Boston MA, USA
US 120V/240V split-phase grid. **Kettle strictly absent.** Fridge + Washing Machine only.

---

## 📊 NILM Models

| Model | Architecture | Notes |
|---|---|---|
| **Seq2point CNN** | 1D CNN, 599-sample window | Primary — best F1 & MAE |
| **DAE** | Denoising Autoencoder | ~8% worse than S2P |
| **FHMM** | Factorial Hidden Markov | Classical baseline |
| **Trivial Zero** | Always predict 0 W | Sanity baseline |
| **Trivial Mean** | Predict dataset mean | Sanity baseline |

---

## 📂 Project Structure

```
src/
├── App.tsx                    # Root app — tabs, state, routing
├── components/
│   ├── smartthings/           # Home view, device cards, language selector
│   ├── analytics/             # Deep energy analytics
│   ├── costs/                 # Bills, tariff, what-if calculator
│   ├── lab/                   # NILM research lab + inference runner
│   ├── settings/              # Settings, CSV upload, tariff editor
│   ├── charts/                # Interactive power chart, domain ladder
│   └── common/                # Header, summary cards, report modal
├── data/
│   ├── nilmConfigs.ts         # 31-house registry, appliance configs, model cards
│   ├── recordedDatasets.ts    # Per-house realistic 24h timeseries generator
│   └── researchExperiments.ts # Benchmark matrix, training curves, failure gallery
├── utils/
│   ├── nilmCore.ts            # Energy, bill, metrics, CSV validation utilities
│   └── apiService.ts          # Frontend → backend API client
├── i18n/
│   ├── languages.ts           # 11 language enum + translation getter
│   └── translations.ts        # All UI strings in 11 Indian languages
└── types/nilm.ts              # All TypeScript types (PRD-conformant)

server.js                      # Express backend API (8 endpoints, 31 houses)
```
