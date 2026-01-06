param(
    [string]$SupabaseUrl,
    [string]$ProjectRef = "jdjwkidtslnqvfednuga",
    [string]$Bucket = "app-assets",
    [string]$Targets,
    [int]$Concurrency = 8
)

# SDK-based sync (no Supabase UI, no Supabase CLI).
# Delegates to ./scripts/upload-assets.ps1 which runs the Node SDK uploader.

$ErrorActionPreference = "Stop"

if (-not $SupabaseUrl) {
    $SupabaseUrl = "https://$ProjectRef.supabase.co"
}

Write-Host "Syncing assets to Supabase Storage (SDK)" -ForegroundColor Cyan
Write-Host "SupabaseUrl: $SupabaseUrl" -ForegroundColor DarkGray
Write-Host "Bucket: $Bucket" -ForegroundColor DarkGray

$args = @(
    "-SupabaseUrl", $SupabaseUrl,
    "-Bucket", $Bucket,
    "-Concurrency", $Concurrency
)

if ($Targets) {
    $args += @("-Targets", $Targets)
}

& "$PSScriptRoot/upload-assets.ps1" @args
