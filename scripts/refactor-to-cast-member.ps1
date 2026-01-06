# Actor to Cast Member Refactoring Script
# Replaces all actor terminology with cast_member throughout frontend

Write-Host "" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Actor to Cast Member Refactoring" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan

$files = @()
$files += Get-ChildItem -Path "frontend/js" -Filter "*.js" -Recurse 
$files += Get-ChildItem -Path "frontend" -Filter "*.html"

Write-Host "Processing $($files.Count) files..." -ForegroundColor Yellow
Write-Host "" -ForegroundColor White

$changed = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content
    
    # Database tables
    $content = $content -replace "\.from\('actors'\)", ".from('cast_members')"
    $content = $content -replace '\.from\("actors"\)', '.from("cast_members")'
    $content = $content -replace "actor_id", "cast_member_id"
    $content = $content -replace "scene_actors", "scene_cast_members"
    $content = $content -replace "character_actor_assignments", "character_cast_assignments"
    $content = $content -replace "actor_continuity", "cast_member_continuity"
    
    # Classes
    $content = $content -replace "ActorService", "CastMemberService"
    $content = $content -replace "SceneActorService", "SceneCastMemberService"
    $content = $content -replace "ActorFormModal", "CastMemberFormModal"
    
    # Files
    $content = $content -replace "actorService\.js", "castMemberService.js"
    $content = $content -replace "actorFormModal\.js", "castMemberFormModal.js"
    $content = $content -replace "sceneActorService\.js", "sceneCastMemberService.js"
    
    # Variables
    $content = $content -replace "\bactorData\b", "castMemberData"
    $content = $content -replace "\bactorId\b", "castMemberId"
    $content = $content -replace "\bactorIds\b", "castMemberIds"
    $content = $content -replace "\bnewActor\b", "newCastMember"
    $content = $content -replace "\bcurrentActor\b", "currentCastMember"
    $content = $content -replace "\bselectedActor\b", "selectedCastMember"
    $content = $content -replace "\ballActors\b", "allCastMembers"
    $content = $content -replace "\bsceneActors\b", "sceneCastMembers"
    $content = $content -replace "\bprojectActors\b", "projectCastMembers"
    $content = $content -replace "\bactorService\b", "castMemberService"
    
    # HTML IDs
    $content = $content -replace 'id="actor', 'id="castMember'
    $content = $content -replace "id='actor", "id='castMember"
    $content = $content -replace 'class="actor-', 'class="cast-member-'
    $content = $content -replace "\bactorDropdown\b", "castMemberDropdown"
    $content = $content -replace "\bactorDetails\b", "castMemberDetails"
    $content = $content -replace "\bactorCalendar\b", "castMemberCalendar"
    $content = $content -replace "\bactorForm\b", "castMemberForm"
    $content = $content -replace "\bactorName\b", "castMemberName"
    $content = $content -replace "\bactorFirstName\b", "castMemberFirstName"
    $content = $content -replace "\bactorLastName\b", "castMemberLastName"
    $content = $content -replace "\bactorEmail\b", "castMemberEmail"
    $content = $content -replace "\bactorPhone\b", "castMemberPhone"
    $content = $content -replace "\bactorRole\b", "castMemberRole"
    
    # UI Text
    $content = $content -replace "Add New Actor", "Add New Cast Member"
    $content = $content -replace "Edit Actor", "Edit Cast Member"
    $content = $content -replace "Delete Actor", "Delete Cast Member"
    $content = $content -replace "Actor Details", "Cast Member Details"
    $content = $content -replace "Select an actor", "Select a cast member"
    $content = $content -replace "No actors", "No cast members"
    $content = $content -replace "Creating actor", "Creating cast member"
    $content = $content -replace "Updating actor", "Updating cast member"
    $content = $content -replace "Deleting actor", "Deleting cast member"
    $content = $content -replace "Actor created", "Cast member created"
    $content = $content -replace "Actor updated", "Cast member updated"
    $content = $content -replace "Actor deleted", "Cast member deleted"
    $content = $content -replace "Previous actor", "Previous cast member"
    $content = $content -replace "Next actor", "Next cast member"
    $content = $content -replace "Actor silhouette", "Cast member silhouette"
    $content = $content -replace "Assign Actor", "Assign Cast Member"
    $content = $content -replace "Quick Add Actor", "Quick Add Cast Member"
    
    # Comments
    $content = $content -replace "ACTOR FORM MODAL", "CAST MEMBER FORM MODAL"
    $content = $content -replace "Actor Form Modal", "Cast Member Form Modal"
    $content = $content -replace "Actor Service", "Cast Member Service"
    $content = $content -replace "actor service", "cast member service"
    $content = $content -replace "actor-related", "cast member-related"
    $content = $content -replace "Handles all actor", "Handles all cast member"
    $content = $content -replace "fetching actors", "fetching cast members"
    $content = $content -replace "fetching actor", "fetching cast member"
    $content = $content -replace "creating actor", "creating cast member"
    $content = $content -replace "updating actor", "updating cast member"
    $content = $content -replace "deleting actor", "deleting cast member"
    $content = $content -replace "searching actors", "searching cast members"
    $content = $content -replace "demo actor", "demo cast member"
    $content = $content -replace "Reusable Actor Creation", "Reusable Cast Member Creation"
    $content = $content -replace "voor actor creation", "voor cast member creation"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        $changed++
        $name = $file.FullName.Replace("$PWD\", "")
        Write-Host "[OK] $name" -ForegroundColor Green
    }
}

Write-Host "" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Updated: $changed / $($files.Count) files" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
