# Product Requirements Document
## PVC ID Card Creation Suite — for Print Shops, Cyber Cafés & CSCs

**Version:** 1.0 (Draft)
**Owner:** Ashutosh
**Date:** August 23, 2026
**Status:** Draft for review

---

## 1. Overview

A cross-platform (Windows + Linux) desktop application that lets print shops, cyber cafés, and Common Service Centers (CSCs) in India quickly produce PVC identity cards — Aadhaar (smart/PVC), PAN, Ayushman Bharat, Voter ID, Driving License, and similar documents — from source PDFs/images, with automatic cropping, automatic PDF decryption, data-driven templating, and batch printing to card printers (Evolis/Zebra class devices).

The business model is subscription-based, with account login and a per-account device limit to control license sharing.

---

## 2. Problem Statement

Operators at CSCs and cyber cafés currently rely on a patchwork of tools (Photoshop, generic photo-editing software, manual cropping) to prepare ID card printouts. This is slow, inconsistent, and error-prone — especially for:

- Password-protected government PDFs (e.g., e-Aadhaar, digitally signed PAN) that must be decrypted before use
- Manually cropping photo/signature regions and aligning them to card templates
- Producing a consistent, print-ready layout across dozens of card types
- Managing print jobs in bulk (e.g., for bulk Ayushman Bharat card camps)

There is no affordable, purpose-built, cross-platform tool for this workflow.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Reduce the time to produce a print-ready PVC card from ~5–10 minutes (manual) to under 30 seconds per card
- Support the top 5 Indian ID document types at launch, with a template engine that allows adding new ones without code changes
- Provide reliable auto-crop with a visible confidence score, and a manual-correction fallback
- Handle password-protected/encrypted PDFs transparently (with user-supplied or auto-derived passwords where legally permissible)
- Run identically on Windows 10/11 and mainstream Linux desktops (Ubuntu/Debian-based, given CSC hardware trends)
- Monetize via subscription tiers with device-level license enforcement
- Meet DPDP Act 2023 obligations given the sensitivity of the data processed

### 3.2 Non-Goals (v1)
- Mobile app (Android/iOS) — deferred
- Automated government-portal scraping/integration (e.g., pulling data directly from UIDAI) — out of scope; user supplies the source PDF/image
- Government-issued official card printing (this tool is for shops producing informational/plastic copies, not authoring official government cards) — **legal positioning must be reviewed** (see Section 11)
- Multi-language UI at launch (Hindi/regional UI is a v1.1 candidate)

---

## 4. Target Users & Personas

| Persona | Description | Key Need |
|---|---|---|
| CSC Operator | Runs a village-level Common Service Center, processes many citizen requests/day | Speed, reliability on modest hardware, offline resilience |
| Cyber Café Owner | Urban/semi-urban shop, walk-in customers wanting printed ID copies | Low per-card cost, batch printing, simple UI |
| Print Shop Owner | Small commercial printer, higher volume, may print for resellers | Multi-device licensing, invoicing, GST compliance |

---

## 5. Core Features

### 5.1 Document Ingestion & Auto-Crop Pipeline
- Import PDF or image (JPG/PNG/scanned TIFF)
- Auto-detect document type (Aadhaar/PAN/Voter ID/DL/Ayushman) using template matching + OCR cues
- Auto-crop photo, signature, and QR/barcode regions using OpenCV-based detection
- **Confidence scoring** per detected region (e.g., 0–100%); regions below a configurable threshold are flagged for manual review
- Manual crop/adjust UI as fallback, with drag handles and zoom
- Auto-rotation and skew correction for scanned documents

### 5.2 PDF Decryption
- Detect password-protected PDFs on import
- **Auto-decrypt attempt (first pass):** try the PDF's filename (without extension) as the password automatically — many source PDFs are saved/shared with the password baked into the filename, so this is tried silently before bothering the user
- **Known-format fallback (second pass):** if the filename attempt fails, try saved "password recipes" per document type (e.g., Aadhaar PDFs are commonly protected with first 4 letters of name in caps + YYYY of birth), where a recipe can be derived from data already entered for that card
- **Manual entry (final fallback):** if both automated attempts fail, prompt the user for the password directly, with an option to save it as a per-document-type recipe for future use
- Decrypt in-memory only; never persist unencrypted source PDFs beyond the session unless the user explicitly opts in
- Handle digitally signed PDFs (PAN, DL) by extracting content without breaking legal signature chains where relevant

### 5.3 Template Engine
- Data-driven templates (JSON/XML-defined) per card type, defining field positions, fonts, photo/signature placeholders, QR code placement, and background art
- Template designer view: place fields visually, save as new/custom template
- Support for both front and back of card
- Variable data fields sourced from OCR extraction (via Tesseract) or manual entry, with an editable preview before print

### 5.4 Batch Printing
- Queue multiple cards for print in one batch
- Printer integration for PVC card printer families (Evolis, Zebra, and similar; abstracted through a printer-driver adapter layer)
- Print job status tracking (queued, printing, completed, failed) with retry
- Dual-side print support, print preview per card

### 5.5 Account, Licensing & Device Limits
- Account creation/login (email + password, optionally OTP-based for Indian phone numbers)
- Subscription tiers (see Section 7)
- **Device fingerprinting** to enforce a per-account device limit (e.g., 2 active devices on a Standard plan); fingerprint based on hardware IDs, tolerant of minor hardware changes to avoid false lockouts
- Remote device de-authorization from a user's account (self-serve "manage my devices" screen)
- Grace-period/offline mode: app should remain usable for a limited period (e.g., 72 hours) without internet, then require re-validation

### 5.6 Billing & Invoicing
- Subscription billing via Razorpay/PayU (UPI, cards, netbanking — India-first payment methods)
- GST-compliant invoice generation for each subscription payment
- Usage-based add-ons (e.g., pay-per-card packs) as a stretch feature

### 5.7 Compliance & Data Handling (DPDP Act 2023)
- Explicit consent capture before processing any identity document
- Data minimization: extracted personal data (photo, name, DOB, ID numbers) stored only as long as operationally necessary, with configurable auto-purge
- Local encryption at rest for any cached personal data
- Audit log of processing events (without storing raw ID numbers in plaintext logs)
- Clear in-app disclosure of what is stored locally vs. sent to backend (e.g., license validation only, not document content, unless the user opts into cloud template sync)

---

## 6. Technical Architecture (Proposed)

Given the hard requirement to run on **both Windows and Linux**, and a preference for a stack that's easy to build with an agentic coding tool (Google Antigravity), the stack below moves off C#/.NET entirely in favor of web-standard technologies. This matters practically, not just stylistically: Antigravity's agents verify their own work by driving a real browser, so a UI that *is* a web app lets agents click through, screenshot, and self-verify changes without a human in the loop for every step — and both TypeScript and Python are the most heavily represented, best-documented languages for coding agents, which translates to fewer agent mistakes and less back-and-forth correction.

| Layer | Technology | Notes |
|---|---|---|
| Desktop shell / UI | **Electron + React + TypeScript** | Single codebase, identical on Windows/Linux; UI is a real web app, so Antigravity's browser-control agents can navigate and verify it directly |
| Image Processing / Auto-Crop | **Python sidecar** — `opencv-python` | Bundled as a local sidecar process (via PyInstaller), called from Electron over local HTTP/IPC; avoids native Node module cross-compilation issues entirely |
| PDF Handling / Decryption | **Python sidecar** — `PyMuPDF` (fitz) | Decryption, text/image extraction, signature-aware parsing; mature cross-platform library, no native build step needed by the Electron side |
| OCR | **Python sidecar** — `pytesseract` (wraps Tesseract) | Field extraction from scanned/embedded content |
| Card Rendering/Compositing | Canvas API / `konva.js` in the Electron renderer, or Python `Pillow` in the sidecar | Either works; keeping it in the renderer keeps the live template preview simpler |
| Backend API | **Python FastAPI** (or Node/Fastify if you'd rather stay in one language for backend+frontend) | Handles licensing, billing, template sync; deploys identically on Linux servers |
| Database | PostgreSQL | Backend store for accounts, licenses, invoices |
| Cache/Session | Redis | Session tokens, device-limit enforcement state |
| Packaging/Updates | **electron-builder** | First-class Windows (NSIS/exe) and Linux (AppImage/deb) targets, with auto-update built in |
| Payments | Razorpay / PayU (Node or Python SDK) | Subscription billing |
| Device Fingerprinting | `node-machine-id` (Electron main process) | Cross-platform out of the box — sidesteps the Windows-WMI-vs-Linux problem C#/.NET would have hit |
| Printer Integration | OS print APIs (Windows Print Spooler / CUPS on Linux) via an abstraction layer in the Electron main process or a small Node/Python module | Evolis/Zebra SDKs still need to be checked for Linux driver support — **flagged risk, see Section 11** |

**Open decision:** if Evolis/Zebra Linux driver support turns out to be weak, an alternative is to route printing through a raw CUPS raster/ICC-profile pipeline instead of vendor SDKs. This needs a spike before committing.

**Why a Python sidecar instead of pure JS:** OpenCV, PDF parsing, and OCR all have deeper, more mature, better-documented libraries in Python than in the Node ecosystem. Keeping them in a separate local process also means the Electron app itself stays lightweight and doesn't need native compilation toolchains on the user's machine — the sidecar ships as a pre-built binary per OS.

---

## 7. Subscription Model (Draft)

| Tier | Price (indicative) | Devices | Cards/month | Notes |
|---|---|---|---|---|
| Starter | ₹499/mo | 1 device | 200 cards | Single cyber café |
| Standard | ₹1,299/mo | 2 devices | 1,000 cards | Small print shop |
| Pro | ₹2,999/mo | 5 devices | Unlimited* | CSC chains, resellers |
| Reseller (v1.1) | Custom | Custom | Custom | White-label option |

*Fair-use cap to be defined.

---

## 8. Roadmap (26 Weeks)

| Phase | Weeks | Deliverables |
|---|---|---|
| Phase 1 — Foundation | 1–4 | Architecture spike (Electron + Python-sidecar IPC validation, printer SDK Linux check), core app shell, account/login |
| Phase 2 — Ingestion Pipeline | 5–9 | PDF import/decryption, auto-crop with confidence scoring, manual correction UI |
| Phase 3 — Template Engine | 10–14 | Template schema, template designer, first 5 card templates (Aadhaar, PAN, Ayushman, Voter ID, DL) |
| Phase 4 — Printing | 15–18 | Printer abstraction layer, batch queue, print preview, Windows + Linux print testing |
| Phase 5 — Licensing & Billing | 19–22 | Device fingerprinting, subscription tiers, Razorpay/PayU integration, GST invoicing |
| Phase 6 — Compliance & Hardening | 23–24 | DPDP consent flows, data purge policies, audit logging, security review |
| Phase 7 — Beta & Launch | 25–26 | Closed beta with CSC/print-shop partners, bug fixes, GA release |

**v1.1 candidates (post-launch):** Hindi/regional language UI, reseller portal, usage-based billing add-ons, mobile companion app.

---

## 9. Non-Functional Requirements

- **Performance:** Auto-crop + template render under 3 seconds per card on a mid-range machine (i3/8GB class)
- **Reliability:** Print queue must survive app crash/restart without losing in-progress jobs
- **Offline resilience:** Core card-creation workflow must function without internet; only licensing check and cloud sync require connectivity
- **Portability:** Identical feature set on Windows 10/11 and Ubuntu 22.04+/Debian-based distros; UI layout should not assume Windows-only conventions (e.g., file paths, printer dialogs)
- **Security:** All stored credentials/tokens encrypted at rest; no plaintext storage of Aadhaar/PAN numbers beyond active session unless user opts in

---

## 10. Success Metrics

- Median time-to-print-ready-card ≤ 30 seconds
- Auto-crop acceptance rate (no manual correction needed) ≥ 85%
- Trial-to-paid conversion ≥ 15%
- Monthly device-limit-related support tickets < 2% of active accounts
- Zero critical DPDP compliance findings in security review

---

## 11. Open Risks & Questions

1. **Legal positioning:** Producing PVC copies of Aadhaar/PAN/Voter ID for citizens needs a clear legal review — UIDAI and other authorities have specific rules about reproduction of these documents. This should be validated with legal counsel before GA, not just a technical assumption.
2. **Evolis/Zebra Linux driver support:** Needs a technical spike in Phase 1; if unsupported, fall back to CUPS raster pipeline.
3. **Electron ↔ Python sidecar packaging:** Bundling a PyInstaller binary inside an electron-builder package per OS needs a working build pipeline validated early (Phase 1) — this is the main new integration risk introduced by the stack change.
4. **Aadhaar password-derivation "recipes":** Storing/using known password formulas needs a DPDP and UIDAI-compliance review — this is sensitive functionality.
5. **Electron binary size/resource use:** Electron apps are heavier than native ones; worth benchmarking on the low-spec (i3/8GB) hardware common at CSCs early, since it directly affects the performance NFR in Section 9.

---

## 12. Appendix — Card Types at Launch

1. Aadhaar (PVC/e-Aadhaar print)
2. PAN Card
3. Ayushman Bharat Card
4. Voter ID (EPIC)
5. Driving License

---

## 13. Codebase Conventions for Agentic Development (Antigravity)

Since this project will be built substantially with Google Antigravity, a few structural choices make agent-driven work more reliable:

- **Monorepo layout**, so agents can reason about the whole system without switching workspaces:
  ```
  /app          – Electron main + preload (TypeScript)
  /renderer     – React UI (TypeScript)
  /sidecar      – Python service (OpenCV, PyMuPDF, Tesseract)
  /backend      – FastAPI service (licensing, billing, sync)
  /shared       – Shared types/schemas (e.g. template JSON schema) used by renderer + backend
  /e2e          – Playwright tests, so browser-driving agents have an existing harness to extend
  ```
- **Playwright for end-to-end tests.** Since the UI is a web app, Antigravity's browser-control agents can drive Playwright tests directly as part of their own verification loop — this is the single biggest lever for letting agents self-check work instead of you manually reviewing every UI change.
- **OpenAPI schema for the sidecar and backend.** Both Python services should expose an OpenAPI spec; this gives agents a machine-readable contract to work against when wiring up the Electron side, instead of inferring request/response shapes from code reading alone.
- **One README per package**, each stating: what the package does, how to run it standalone, how to test it standalone. Agents orient much faster with local context than a single root-level README.
- **Task-sized issues.** Antigravity's Manager surface works best when given scoped, single-outcome tasks (e.g., "implement PDF password-recipe lookup for Aadhaar in /sidecar" rather than "build the PDF module") — worth keeping the Phase breakdown in Section 8 decomposed into tickets at roughly that granularity when work actually starts.

---

*This PRD is a living document and will be revised as technical spikes (Phase 1) validate the cross-platform assumptions above.*
