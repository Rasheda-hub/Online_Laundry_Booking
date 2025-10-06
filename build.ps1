# PowerShell build script for Windows

Write-Host "📦 Installing Python dependencies..." -ForegroundColor Cyan
pip install -r backend/requirements.txt

Write-Host "📦 Installing Node dependencies..." -ForegroundColor Cyan
Set-Location frontend-react
npm install

Write-Host "🏗️ Building React app..." -ForegroundColor Cyan
npm run build

Write-Host "📂 Copying build to backend/static..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path ../backend/static | Out-Null
Copy-Item -Path dist/* -Destination ../backend/static/ -Recurse -Force

Set-Location ..
Write-Host "✅ Build complete!" -ForegroundColor Green
