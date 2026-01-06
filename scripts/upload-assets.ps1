Param(
  [string]$SupabaseUrl,
  [Alias('SupabaseSecretKey','SecretKey')]
  [string]$ServiceRoleKey,
  [string]$Bucket = "app-assets",
  [string]$Targets,
  [int]$Concurrency = 8
)

$ErrorActionPreference = "Stop"

Write-Host "Supabase asset upload -> Storage bucket '$Bucket'" -ForegroundColor Cyan

if (-not $SupabaseUrl) {
  $SupabaseUrl = Read-Host "SUPABASE_URL (bv. https://xxxxx.supabase.co)"
}
if (-not $ServiceRoleKey) {
  # Prefer env var if already set (non-interactive)
  if ($env:SUPABASE_SECRET_KEY) {
    $ServiceRoleKey = $env:SUPABASE_SECRET_KEY
  } elseif ($env:SUPABASE_SERVICE_ROLE_KEY) {
    $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
  } else {
    Write-Host "Tip: als plakken niet werkt in de prompt: kopieer je key naar het clipboard en druk Enter." -ForegroundColor Yellow
    Write-Host "Clipboard wordt geprobeerd; als die leeg is vragen we alsnog input." -ForegroundColor Yellow
    $null = Read-Host "Druk Enter om clipboard te gebruiken (of typ de key en druk Enter)"

    # If user pasted into the Read-Host line above, use that
    if (-not [string]::IsNullOrWhiteSpace($null)) {
      $ServiceRoleKey = $null
    } else {
      try {
        $clip = Get-Clipboard -Raw -ErrorAction Stop
        if (-not [string]::IsNullOrWhiteSpace($clip)) {
          $ServiceRoleKey = $clip.Trim()
        }
      } catch {
        # Ignore clipboard errors; will fall back to Read-Host
      }

      if (-not $ServiceRoleKey) {
        $ServiceRoleKey = Read-Host "SUPABASE_SECRET_KEY (sb_secret_..., NIET publishable/anon)"
      }
    }
  }
}

if ([string]::IsNullOrWhiteSpace($SupabaseUrl) -or [string]::IsNullOrWhiteSpace($ServiceRoleKey)) {
  throw "SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn verplicht."
}

$env:SUPABASE_URL = $SupabaseUrl
$env:SUPABASE_SECRET_KEY = $ServiceRoleKey
$env:SUPABASE_BUCKET = $Bucket
$env:ASSET_UPLOAD_CONCURRENCY = "$Concurrency"

if ($Targets) {
  $env:ASSET_TARGETS = $Targets
  Write-Host "Targets override: $Targets" -ForegroundColor Yellow
} else {
  if (Test-Path Env:ASSET_TARGETS) { Remove-Item Env:ASSET_TARGETS }
}

Write-Host "Running: npm run upload-assets" -ForegroundColor Green
npm run upload-assets

$exit = $LASTEXITCODE

# Best effort cleanup of the sensitive env var from current session
Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue

if ($exit -ne 0) {
  throw "Upload failed (exit code $exit)."
}

Write-Host "Upload completed." -ForegroundColor Green
