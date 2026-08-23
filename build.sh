#!/bin/bash

# Exit on error
set -e

echo "Starting PVC Card Suite Build & Obfuscation Pipeline..."

# 1. Build & Obfuscate React Renderer
echo "[1/3] Building and Obfuscating Renderer..."
cd renderer
npm install
npm run build
cd ..

echo "Obfuscating JS assets in renderer/dist..."
# Obfuscate all JS files in the Vite build output
npx javascript-obfuscator renderer/dist/assets --output renderer/dist/assets --compact true --control-flow-flattening true --dead-code-injection true

# 2. Obfuscate Electron Main Process
echo "[2/3] Obfuscating Electron App Process..."
mkdir -p app/dist_obfuscated
# Copy files first so we don't destroy the original source
cp app/*.js app/dist_obfuscated/
npx javascript-obfuscator app/dist_obfuscated --output app/dist_obfuscated --compact true --control-flow-flattening true
echo "Electron app successfully obfuscated into app/dist_obfuscated"

# 3. Obfuscate Python Sidecar with PyArmor
echo "[3/3] Building and Obfuscating Python Sidecar..."
cd sidecar
# Ensure build reqs are installed
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-build.txt

# Run PyArmor to obfuscate main.py and all local service imports
pyarmor gen -O dist main.py pdf_service.py cv_service.py ocr_service.py billing_service.py
cd ..

echo ""
echo "============================================="
echo "Build Pipeline Complete!"
echo "Obfuscated UI: renderer/dist/"
echo "Obfuscated Electron: app/dist_obfuscated/"
echo "Obfuscated Sidecar: sidecar/dist/"
echo "============================================="
