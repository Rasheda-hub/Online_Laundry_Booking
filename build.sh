#!/bin/bash
# Build script for deployment

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "📦 Installing Node dependencies..."
cd frontend-react
npm install

echo "🏗️ Building React app..."
npm run build

echo "📂 Copying build to backend/static..."
mkdir -p ../backend/static
cp -r dist/* ../backend/static/

echo "✅ Build complete!"