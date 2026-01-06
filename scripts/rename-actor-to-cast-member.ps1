# Script to rename all 'actor' references to 'cast_member' throughout the codebase
# This is a comprehensive refactoring from 'actor' to 'cast member' terminology

Write-Host "Starting Actor → Cast Member Refactoring..." -ForegroundColor Cyan

# Define file patterns to process
$jsFiles = Get-ChildItem -Path "frontend/js" -Filter "*.js" -Recurse
$htmlFiles = Get-ChildItem -Path "frontend" -Filter "*.html"
$cssFiles = Get-ChildItem -Path "frontend/css" -Filter "*.css"

$totalFiles = 0
$changedFiles = 0

# Replacement mappings (order matters - most specific first)
$replacements = @(
    # JavaScript/Database identifiers (snake_case)
    @{ Pattern = 'actor_id'; Replacement = 'cast_member_id' }
    @{ Pattern = 'scene_actors'; Replacement = 'scene_cast_members' }
    @{ Pattern = 'character_actor_assignments'; Replacement = 'character_cast_assignments' }
    @{ Pattern = 'actor_continuity'; Replacement = 'cast_member_continuity' }
    @{ Pattern = 'SceneActorService'; Replacement = 'SceneCastMemberService' }
    @{ Pattern = 'sceneActorService'; Replacement = 'sceneCastMemberService' }
    @{ Pattern = 'ActorService'; Replacement = 'CastMemberService' }
    @{ Pattern = 'actorService'; Replacement = 'castMemberService' }
    @{ Pattern = 'ActorFormModal'; Replacement = 'CastMemberFormModal' }
    @{ Pattern = 'actorFormModal'; Replacement = 'castMemberFormModal' }
    
    # HTML IDs and classes (kebab-case and camelCase)
    @{ Pattern = 'actor-'; Replacement = 'cast-member-' }
    @{ Pattern = 'actorDropdown'; Replacement = 'castMemberDropdown' }
    @{ Pattern = 'actorDetails'; Replacement = 'castMemberDetails' }
    @{ Pattern = 'actorCalendar'; Replacement = 'castMemberCalendar' }
    @{ Pattern = 'actorName'; Replacement = 'castMemberName' }
    
    # Variable names (camelCase)
    @{ Pattern = '\bactorData\b'; Replacement = 'castMemberData' }
    @{ Pattern = '\bactorId\b'; Replacement = 'castMemberId' }
    @{ Pattern = '\bactor\b'; Replacement = 'castMember' }  # Must be last, most general
    @{ Pattern = '\bactors\b'; Replacement = 'castMembers' }
    
    # User-facing text
    @{ Pattern = 'Actors'; Replacement = 'Cast' }
    @{ Pattern = 'Actor'; Replacement = 'Cast Member' }
)

function Replace-InFile {
    param(
        [string]$FilePath
    )
    
    $content = Get-Content -Path $FilePath -Raw -ErrorAction Stop
    $originalContent = $content
    
    foreach ($replacement in $replacements) {
        $content = $content -replace $replacement.Pattern, $replacement.Replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -NoNewline
        return $true
    }
    
    return $false
}

# Process all files
$allFiles = $jsFiles + $htmlFiles + $cssFiles

foreach ($file in $allFiles) {
    $totalFiles++
    try {
        if (Replace-InFile -FilePath $file.FullName) {
            $changedFiles++
            Write-Host "✓ Updated: $($file.FullName)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

Write-Host "`nRefactoring Complete!" -ForegroundColor Cyan
Write-Host "Files processed: $totalFiles" -ForegroundColor White
Write-Host "Files changed: $changedFiles" -ForegroundColor Yellow
Write-Host "`nNOTE: Don't forget to:" -ForegroundColor Yellow
Write-Host "1. Run the migration: 20260106000003_rename_actors_to_cast_members.sql" -ForegroundColor White
Write-Host "2. Manually rename HTML files (actors.html → cast.html, etc.)" -ForegroundColor White
Write-Host "3. Update navigation links in all HTML files" -ForegroundColor White
Write-Host "4. Test thoroughly!" -ForegroundColor White
