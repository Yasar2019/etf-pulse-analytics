$ErrorActionPreference = 'Stop'

Write-Host "ETF Pulse Analytics - Local Preview" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed. Install Node.js LTS first from https://nodejs.org/" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
}

Write-Host "Starting ETF Pulse on http://localhost:3000" -ForegroundColor Green
Start-Process "http://localhost:3000"
npm run dev
