#!/usr/bin/env bash
# Exit on any error
set -o errexit

echo "=== 1. Installing Backend Dependencies ==="
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "=== 2. Ensuring Node.js is installed ==="
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js v18..."
    curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz | tar -xJ
    export PATH="$PWD/node-v18.20.4-linux-x64/bin:$PATH"
fi

node --version
npm --version

echo "=== 3. Building Frontend Assets ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Build Complete! Frontend and Backend are ready ==="
