# Comprehensive Actor → Cast Member Refactoring
# Phase 1: Database and Service Layer (Most Critical)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ACTOR → CAST MEMBER REFACTORING" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseDir = "frontend"
$files = @()

# Get all JS and HTML files (excluding node_modules, etc.)
$files += Get-ChildItem -Path "$baseDir/js" -Filter "*.js" -Recurse | Where-Object { $_.FullName -notmatch 'node_modules' }
$files += Get-ChildItem -Path $baseDir -Filter "*.html" | Where-Object { $_.Name -notmatch 'node_modules' }

Write-Host "Found $($files.Count) files to process`n" -ForegroundColor Yellow

# Counters
$filesChanged = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    # PHASE 1: Database/Service Layer (snake_case)
    $content = $content -replace '\.from\(''actors''\)', '.from(''cast_members'')'
    $content = $content -replace '\.from\("actors"\)', '.from("cast_members")'
    
    $content = $content -creplace '\bactor_id\b', 'cast_member_id'
    $content = $content -creplace '\bscene_actors\b', 'scene_cast_members'
    $content = $content -creplace '\bcharacter_actor_assignments\b', 'character_cast_assignments'
    $content = $content -creplace '\bactor_continuity\b', 'cast_member_continuity'
    
    # PHASE 2: Service Classes (PascalCase)
    $content = $content -creplace '\bActorService\b', 'CastMemberService'
    $content = $content -creplace '\bSceneActorService\b', 'SceneCastMemberService'
    $content = $content -creplace '\bActorFormModal\b', 'CastMemberFormModal'
    
    # PHASE 3: File paths
    $content = $content -replace 'actorService\.js', 'castMemberService.js'
    $content = $content -replace 'actorFormModal\.js', 'castMemberFormModal.js'
    $content = $content -replace 'sceneActorService\.js', 'sceneCastMemberService.js'
    
    # PHASE 4: Variable names (camelCase) - be careful with boundaries
    $content = $content -creplace '\bactorData\b', 'castMemberData'
    $content = $content -creplace '\bactorId\b', 'castMemberId'
    $content = $content -creplace '\bactorIds\b', 'castMemberIds'
    $content = $content -creplace '\bnewActor\b', 'newCastMember'
    $content = $content -creplace '\bcurrentActor\b', 'currentCastMember'
    $content = $content -creplace '\bselectedActor\b', 'selectedCastMember'
    $content = $content -creplace '\ballActors\b', 'allCastMembers'
    $content = $content -creplace '\bsceneActors\b', 'sceneCastMembers'
    $content = $content -creplace '\bprojectActors\b', 'projectCastMembers'
    
    # PHASE 5: HTML IDs and classes (kebab-case and camelCase)
    $content = $content -replace 'id="actor', 'id="castMember'
    $content = $content -replace 'id=''actor', 'id=''castMember'
    $content = $content -replace 'class="actor-', 'class="cast-member-'
    $content = $content -replace 'class=''actor-', 'class=''cast-member-'
    $content = $content -creplace '\bactorDropdown\b', 'castMemberDropdown'
    $content = $content -creplace '\bactorDetails\b', 'castMemberDetails'
    $content = $content -creplace '\bactorCalendar\b', 'castMemberCalendar'
    $content = $content -creplace '\bactorForm\b', 'castMemberForm'
    $content = $content -creplace '\bactorName\b', 'castMemberName'
    $content = $content -creplace '\bactorFirstName\b', 'castMemberFirstName'
    $content = $content -creplace '\bactorLastName\b', 'castMemberLastName'
    $content = $content -creplace '\bactorEmail\b', 'castMemberEmail'
    $content = $content -creplace '\bactorPhone\b', 'castMemberPhone'
    $content = $content -creplace '\bactorRole\b', 'castMemberRole'
    
    # PHASE 6: User-facing text (preserve case sensitivity where needed)
    $content = $content -replace 'Add New Actor', 'Add New Cast Member'
    $content = $content -replace 'Edit Actor', 'Edit Cast Member'
    $content = $content -replace 'Delete Actor', 'Delete Cast Member'
    $content = $content -replace 'Actor Details', 'Cast Member Details'
    $content = $content -replace 'Select an actor', 'Select a cast member'
    $content = $content -replace 'No actors', 'No cast members'
    $content = $content -replace 'Creating actor', 'Creating cast member'
    $content = $content -replace 'Updating actor', 'Updating cast member'
    $content = $content -replace 'Deleting actor', 'Deleting cast member'
    $content = $content -replace 'Actor created', 'Cast member created'
    $content = $content -replace 'Actor updated', 'Cast member updated'
    $content = $content -replace 'Actor deleted', 'Cast member deleted'
    $content = $content -replace 'Previous actor', 'Previous cast member'
    $content = $content -replace 'Next actor', 'Next cast member'
    $content = $content -replace 'Actor silhouette', 'Cast member silhouette'
    $content = $content -replace 'Assign Actor', 'Assign Cast Member'
    $content = $content -replace 'Quick Add Actor', 'Quick Add Cast Member'
    
    # PHASE 7: Comments and documentation
    $content = $content -replace 'Actor Service', 'Cast Member Service'
    $content = $content -replace 'actor service', 'cast member service'
    $content = $content -replace 'actor-related', 'cast member-related'
    $content = $content -replace 'Handles all actor', 'Handles all cast member'
    $content = $content -replace 'Create sample actors', 'Create sample cast members'
    $content = $content -replace 'fetching actors', 'fetching cast members'
    $content = $content -replace 'fetching actor', 'fetching cast member'
    $content = $content -replace 'creating actor', 'creating cast member'
    $content = $content -replace 'updating actor', 'updating cast member'
    $content = $content -replace 'deleting actor', 'deleting cast member'
    $content = $content -replace 'searching actors', 'searching cast members'
    $content = $content -replace 'demo actor', 'demo cast member'
    
    # Save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        $filesChanged++
        $rel = $file.FullName -replace [regex]::Escape($PWD.Path + '\'), ''
        Write-Host "✓ $rel" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FILES UPDATED: $filesChanged / $($files.Count)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Manual steps remaining:" -ForegroundColor Yellow
Write-Host "1. Rename HTML files: actors.html → cast.html, actors-detail.html → cast-detail.html" -ForegroundColor White
Write-Host "2. Update navigation menu links" -ForegroundColor White
Write-Host "3. Run database migration: 20260106000003_rename_actors_to_cast_members.sql" -ForegroundColor White
Write-Host "4. Test all functionality" -ForegroundColor White
Write-Host ""
