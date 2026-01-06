# Prepare Release Script
# Automates release preparation before pushing to main

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "[RELEASE] Preparing Release..." -ForegroundColor Cyan
Write-Host ""

# Read version files
$currentVersion = Get-Content "VERSION" -Raw
$nextVersion = Get-Content "NEXT_VERSION" -Raw
$currentVersion = $currentVersion.Trim()
$nextVersion = $nextVersion.Trim()

Write-Host "[VERSION] Current: $currentVersion" -ForegroundColor Green
Write-Host "[VERSION] Next: $nextVersion" -ForegroundColor Yellow
Write-Host ""

# Check if on main branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main" -and !$DryRun) {
    Write-Host "[WARNING] Not on main branch (current: $currentBranch)" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "[ERROR] Aborted" -ForegroundColor Red
        exit 1
    }
}

# Validate next version folder exists
$nextVersionFolder = "docs\releases\v$nextVersion"
if (!(Test-Path $nextVersionFolder)) {
    Write-Host "[ERROR] Next version folder not found: $nextVersionFolder" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Next version folder exists: $nextVersionFolder" -ForegroundColor Green

# Check for documentation files
$requiredDocs = @("README.md")
foreach ($doc in $requiredDocs) {
    $docPath = "$nextVersionFolder\$doc"
    if (!(Test-Path $docPath)) {
        Write-Host "[WARN] Missing $doc in $nextVersionFolder" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Found: $doc" -ForegroundColor Green
    }
}

# Check for migrations in current release
$migrationsFolder = "supabase\migrations"
$todayDate = Get-Date -Format "yyyyMMdd"
$todayMigrations = Get-ChildItem $migrationsFolder -Filter "${todayDate}*.sql" -ErrorAction SilentlyContinue

if ($todayMigrations) {
    Write-Host ""
    Write-Host "[MIGRATIONS] Found for today:" -ForegroundColor Cyan
    foreach ($migration in $todayMigrations) {
        Write-Host "  - $($migration.Name)" -ForegroundColor White
    }
    
    # Check if migrations are documented
    $readmePath = "$nextVersionFolder\README.md"
    if (Test-Path $readmePath) {
        $readmeContent = Get-Content $readmePath -Raw
        $allDocumented = $true
        foreach ($migration in $todayMigrations) {
            if ($readmeContent -notmatch $migration.BaseName) {
                Write-Host "  [WARN] $($migration.Name) not documented in README.md" -ForegroundColor Yellow
                $allDocumented = $false
            }
        }
        if ($allDocumented) {
            Write-Host "[OK] All migrations documented" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "[CHANGELOG] Generating from commits..." -ForegroundColor Cyan

# Get commits since last version tag
$lastTag = "v$currentVersion"
$commits = git log "$lastTag..HEAD" --pretty=format:"%s" 2>$null

if (!$commits) {
    Write-Host "[WARN] No commits found since $lastTag" -ForegroundColor Yellow
    Write-Host "  Getting all commits from current branch..." -ForegroundColor White
    $commits = git log --pretty=format:"%s" -n 20
}

# Categorize commits
$features = @()
$fixes = @()
$docs = @()
$technical = @()
$other = @()

foreach ($commit in $commits) {
    if ($commit -match "^feat(\(.*\))?:\s*(.+)") {
        $features += $matches[2]
    }
    elseif ($commit -match "^fix(\(.*\))?:\s*(.+)") {
        $fixes += $matches[2]
    }
    elseif ($commit -match "^docs(\(.*\))?:\s*(.+)") {
        $docs += $matches[2]
    }
    elseif ($commit -match "^(chore|refactor|test|style)(\(.*\))?:\s*(.+)") {
        $technical += $matches[3]
    }
    else {
        $other += $commit
    }
}

# Generate changelog section
$changelogSection = "## [$nextVersion] - $(Get-Date -Format 'yyyy-MM-dd')`n`n"

if ($features.Count -gt 0) {
    $changelogSection += "### Added`n"
    foreach ($feature in $features) {
        $changelogSection += "- $feature`n"
    }
    $changelogSection += "`n"
}

if ($fixes.Count -gt 0) {
    $changelogSection += "### Fixed`n"
    foreach ($fix in $fixes) {
        $changelogSection += "- $fix`n"
    }
    $changelogSection += "`n"
}

if ($docs.Count -gt 0) {
    $changelogSection += "### Documentation`n"
    foreach ($doc in $docs) {
        $changelogSection += "- $doc`n"
    }
    $changelogSection += "`n"
}

if ($technical.Count -gt 0) {
    $changelogSection += "### Technical`n"
    foreach ($tech in $technical) {
        $changelogSection += "- $tech`n"
    }
    
    # Add migrations to technical section
    if ($todayMigrations) {
        foreach ($migration in $todayMigrations) {
            $changelogSection += "- Migration: ``$($migration.Name)```n"
        }
    }
    $changelogSection += "`n"
}

if ($other.Count -gt 0) {
    $changelogSection += "### Other`n"
    foreach ($item in $other) {
        $changelogSection += "- $item`n"
    }
    $changelogSection += "`n"
}

Write-Host ""
Write-Host "[CHANGELOG] Generated:" -ForegroundColor Cyan
Write-Host $changelogSection -ForegroundColor White

if (!$DryRun) {
    # Update CHANGELOG.md
    Write-Host ""
    Write-Host "[UPDATE] Updating CHANGELOG.md..." -ForegroundColor Cyan
    
    $changelogPath = "CHANGELOG.md"
    $changelogContent = Get-Content $changelogPath -Raw
    
    # Insert new section after "## [Unreleased]" section
    $unreleaseEnd = $changelogContent.IndexOf("`n---`n")
    if ($unreleaseEnd -gt 0) {
        $before = $changelogContent.Substring(0, $unreleaseEnd + 6)
        $after = $changelogContent.Substring($unreleaseEnd + 6)
        $newChangelog = $before + "`n" + $changelogSection + "`n---`n" + $after
        Set-Content $changelogPath $newChangelog -NoNewline
        Write-Host "[OK] CHANGELOG.md updated" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Could not find Unreleased section in CHANGELOG.md" -ForegroundColor Yellow
    }
    
    # Update VERSION file
    Write-Host "[UPDATE] Updating VERSION to $nextVersion..." -ForegroundColor Cyan
    Set-Content "VERSION" $nextVersion
    Write-Host "[OK] VERSION updated" -ForegroundColor Green
    
    # Create git tag
    Write-Host "[TAG] Creating git tag v$nextVersion..." -ForegroundColor Cyan
    git tag "v$nextVersion" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Tag created: v$nextVersion" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Tag already exists or failed to create" -ForegroundColor Yellow
    }
    
    # Increment NEXT_VERSION (patch bump)
    Write-Host "[UPDATE] Incrementing NEXT_VERSION..." -ForegroundColor Cyan
    $versionParts = $nextVersion.Split('.')
    $versionParts[2] = [int]$versionParts[2] + 1
    $newNextVersion = $versionParts -join '.'
    Set-Content "NEXT_VERSION" $newNextVersion
    Write-Host "[OK] NEXT_VERSION set to $newNextVersion" -ForegroundColor Green
    
    # Create next version folder
    $newNextFolder = "docs\releases\v$newNextVersion"
    if (!(Test-Path $newNextFolder)) {
        Write-Host "[CREATE] Creating next version folder: $newNextFolder..." -ForegroundColor Cyan
        New-Item -ItemType Directory $newNextFolder | Out-Null
        
        # Copy template files
        if (Test-Path "docs\releases\.template") {
            Copy-Item "docs\releases\.template\*" $newNextFolder
            
            # Replace placeholders in template files
            Get-ChildItem $newNextFolder -Filter "*.md" | ForEach-Object {
                $content = Get-Content $_.FullName -Raw
                $content = $content -replace "vX\.Y\.Z", "v$newNextVersion"
                $content = $content -replace "X\.Y\.Z", $newNextVersion
                Set-Content $_.FullName $content -NoNewline
            }
            
            Write-Host "[OK] Next version folder created with templates" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] Release preparation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review CHANGELOG.md" -ForegroundColor White
    Write-Host "2. Commit changes: git add . ; git commit -m 'chore: Release v$nextVersion'" -ForegroundColor White
    Write-Host "3. Push to main: git push origin main --tags" -ForegroundColor White
    Write-Host "4. Continue work in v$newNextVersion folder" -ForegroundColor White
    
} else {
    Write-Host ""
    Write-Host "[DRY RUN] No changes made" -ForegroundColor Yellow
    Write-Host "  Run without -DryRun to apply changes" -ForegroundColor White
}

Write-Host ""
