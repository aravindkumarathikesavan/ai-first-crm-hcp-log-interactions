#!/usr/bin/env bash
# Exit on any error
set -o errexit

# Determine the repository root directory
if [ -d "frontend" ] && [ -d "backend" ]; then
    ROOT_DIR="$(pwd)"
elif [ -d "../frontend" ]; then
    ROOT_DIR="$(cd .. && pwd)"
else
    ROOT_DIR="$(pwd)"
fi

echo "=== Detected Repository Root: $ROOT_DIR ==="

echo "=== 1. Installing Backend Dependencies ==="
if command -v pip &> /dev/null; then
    PIP_CMD="pip"
elif command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif command -v python3 &> /dev/null; then
    PIP_CMD="python3 -m pip"
elif command -v python &> /dev/null; then
    PIP_CMD="python -m pip"
else
    echo "ERROR: No pip or python found!"
    exit 1
fi

$PIP_CMD install --upgrade pip
if [ -f "$ROOT_DIR/backend/requirements.txt" ]; then
    $PIP_CMD install -r "$ROOT_DIR/backend/requirements.txt"
elif [ -f "requirements.txt" ]; then
    $PIP_CMD install -r requirements.txt
fi

echo "=== 2. Ensuring Node.js is installed ==="
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Node.js not found. Installing Node.js v18..."
    curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz | tar -xJ
    export PATH="$PWD/node-v18.20.4-linux-x64/bin:$PATH"
fi

node --version
npm --version

echo "=== 3. Building Frontend Assets ==="
cd "$ROOT_DIR/frontend"
npm install
npm run build

echo "=== Build Complete! Frontend and Backend are ready ==="
