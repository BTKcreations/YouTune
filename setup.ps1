Write-Host "=== YouTune Setup & Verification (PowerShell) ===" -ForegroundColor Cyan

# 1. Environment file check
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# 2. Backend setup
Write-Host "`nSetting up Python backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Installing backend requirements..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install -r requirements.txt

# 3. Frontend setup
Write-Host "`nSetting up React Frontend..." -ForegroundColor Cyan
Set-Location ..\frontend

Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Verifying Frontend TypeScript build..." -ForegroundColor Yellow
npm run build

Set-Location ..
Write-Host "`n=== YouTune Environment Ready! ===" -ForegroundColor Green
Write-Host "Run Docker Compose: docker-compose up --build" -ForegroundColor White
Write-Host "Or run locally: backend in port 8000, frontend in port 5173" -ForegroundColor White
