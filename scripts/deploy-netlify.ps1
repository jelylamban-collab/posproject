# Deploy Netlify helper script (PowerShell)
# Usage: Open PowerShell in the repo root and run: .\scripts\deploy-netlify.ps1

Write-Host "Starting Netlify deploy script..."

# Ensure Node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not on PATH. Install Node 18+ and re-run."
  exit 1
}

# Install dependencies
Write-Host "Installing npm dependencies (ci)..."
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "npm ci failed"; exit 1 }

# Build
Write-Host "Building production bundle..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

# Ensure netlify CLI
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "Netlify CLI not found; installing globally (requires admin privileges)..."
  npm i -g netlify-cli
  if ($LASTEXITCODE -ne 0) { Write-Error "Failed to install netlify-cli"; exit 1 }
}

Write-Host "Launching interactive Netlify deploy..."
Write-Host "If you want to deploy to production directly, run: netlify deploy --dir=dist --prod --site=<SITE_ID>"

# Run interactive deploy
netlify deploy --dir=dist

if ($LASTEXITCODE -ne 0) { Write-Error "Netlify deploy failed"; exit 1 }

Write-Host "If you want to publish the draft URL to production, run the following command when ready:"
Write-Host "  netlify deploy --dir=dist --prod --site=<YOUR_SITE_ID>"

Write-Host "Done."