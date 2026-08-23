#!/bin/bash

# Exit on error
set -e

echo "Starting PVC Card Suite Production Packaging..."

# 1. Package Python Sidecar
echo "[1/3] Compiling Python Sidecar with PyInstaller..."
cd sidecar
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-build.txt

# Run PyInstaller
# --onedir creates a folder with the executable and dependencies (faster startup than --onefile)
# --noconsole prevents the command prompt from appearing on Windows
pyinstaller --noconfirm --onedir --noconsole --name main --distpath dist_bin main.py
cd ..

# 2. Build React Renderer
echo "[2/3] Building React UI..."
cd renderer
npm install
npm run build
cd ..

# 3. Package Electron App
echo "[3/3] Packaging Electron Application..."
cd app
npm install
# Run electron-builder (outputs to app/dist by default)
npm run dist
cd ..

echo ""
echo "================================================="
echo "Packaging Complete!"
echo "The distributable installers are located in:"
echo "./app/dist/"
echo "================================================="
