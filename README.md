# PVC Card Creation Suite

## Overview
The PVC Card Creation Suite is an enterprise-grade desktop application designed for automated ingestion, processing, and printing of physical identification cards. Built specifically for high-volume environments and air-gapped systems, the software utilizes a hybrid architecture featuring an Electron-based frontend and a Python-powered computer vision sidecar.

## Architecture
The application is structured into a monorepo containing distinct logical layers:
*   **Electron App (`app/`)**: The main process responsible for window management, inter-process communication (IPC), lifecycle management of the Python sidecar, and native OS printer spooling.
*   **React Renderer (`renderer/`)**: The user interface, built with React and TypeScript, communicating with the sidecar via local HTTP requests.
*   **Python Sidecar (`sidecar/`)**: A FastAPI microservice running locally alongside the Electron application. It handles CPU-heavy tasks such as PDF decryption, OpenCV Haar Cascade facial detection, PyTesseract optical character recognition (OCR), and RSA cryptographic license validation.
*   **Shared Contracts (`shared/`)**: TypeScript interfaces defining the JSON schema for template layouts, ensuring a strict data contract between the rendering engine and the layout templates.

## Current Progress
The project has successfully completed the following development phases:

*   **Phase 1: Foundation** - Established the monorepo structure, initialized the Electron/React and FastAPI environments, and validated local IPC communications. Built the primary authentication interface.
*   **Phase 2: Ingestion Pipeline** - Implemented PDF decryption workflows utilizing PyMuPDF and integrated OpenCV Haar Cascades for automated facial region extraction and cropping.
*   **Phase 3: Template Engine** - Developed a data-driven HTML/CSS absolute positioning engine. Integrated PyTesseract for automated field extraction (OCR) and mapped extracted data to structured JSON templates (e.g., Aadhaar, PAN).
*   **Phase 4: Printing** - Engineered a cross-platform (Linux/Windows) printing abstraction layer utilizing Electron's headless `BrowserWindow` to interface directly with OS print spoolers (CUPS/Windows Print Spooler), including support for dual-sided printing via CSS page breaks. Built a comprehensive Batch Print Queue UI.
*   **Phase 5: Licensing & Billing** - Implemented an offline RSA cryptographic activation system to support air-gapped environments. Developed the wallet ledger to enforce print credit deductions per hardware print job, alongside foundational API hooks for Razorpay online top-ups.
*   **Phase 6: Compliance & Hardening** - Integrated zero-logging Fast API middleware with strict HTTP Cache-Control headers to ensure PII (Aadhaar/PAN) is never written to disk. Added a comprehensive code obfuscation pipeline using PyArmor and Javascript-Obfuscator.
*   **Phase 7: Beta & Launch** - Configured a robust CI/CD master script (`package.sh`) integrating PyInstaller and Electron Builder to compile the hybrid microservices into a single standalone `.exe` (or `.AppImage`) installer, abstracting away Python dependencies for end-users.

## Running the Application

### Prerequisites
Ensure the following dependencies are installed on your system:
*   Node.js (v18+)
*   Python (3.10+)
*   Tesseract OCR (`tesseract-ocr` package on Linux, or the Tesseract executable in the system PATH on Windows)
*   Git

### 1. Python Sidecar Setup
Navigate to the `sidecar` directory, create a virtual environment, and install the required dependencies.

**Linux / macOS:**
```bash
cd sidecar
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Windows:**
```cmd
cd sidecar
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Note: The sidecar must be running on `http://127.0.0.1:8000` before launching the frontend.*

### 2. Electron Frontend Setup
Open a new terminal window, navigate to the `renderer` directory to build the React application, and then launch the Electron wrapper.

```bash
# 1. Install dependencies and build the UI
cd renderer
npm install
npm run build

# 2. Launch the Electron App
cd ../app
npm install
npm start
```

### Production Build (Packaging)
To package the application into a single standalone installer (e.g. `.exe` on Windows or `.AppImage` on Linux), run the unified packaging script from the root directory:

```bash
./package.sh
```

This script will automatically:
1. Bundle the Python sidecar and OpenCV dependencies into a compiled binary using `pyinstaller`.
2. Build the production React assets.
3. Bundle the Electron application via `electron-builder`.

The final distributable installer will be generated in `app/dist/`.

> **Note**: Packaging tools are not cross-compilers. To generate a Windows `.exe`, you must clone this repository and run `./package.sh` (or a `.bat` equivalent) natively on a Windows machine.
