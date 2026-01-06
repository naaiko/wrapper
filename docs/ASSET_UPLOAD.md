# Supabase Storage uploads (app-assets)

Dit beschrijft hoe statische assets automatisch naar de bestaande public bucket `app-assets` gaan, zonder UI-stappen.

## Architectuur
- Lokaal: assets leven in de repo en worden door een script gelezen.
- Upload: `scripts/upload-assets.mjs` pusht bestanden naar Supabase Storage met `upsert: true` (idempotent; overschrijft bestaande bestanden).
- Bucket: `app-assets` (public). Paden in de bucket volgen de relatieve paden vanuit de repo-root.
- Publice URL: `<SUPABASE_URL>/storage/v1/object/public/app-assets/<relatief-pad>`.

## Voorwaarden
Zet in je omgeving (lokaal of CI) secrets, niet in git:
```
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```
Backward-compat (als je nog de oude benaming gebruikt):
```
SUPABASE_SERVICE_ROLE_KEY=...
```
Optioneel:
```
SUPABASE_BUCKET=app-assets
ASSET_TARGETS=docs/resources,docs/releases,releases.json,CHANGELOG.md
ASSET_UPLOAD_CONCURRENCY=8
WORKSPACE_ROOT=/abs/path/naar/repo
```

## Default targets
Als `ASSET_TARGETS` leeg is, worden de volgende paden geüpload (alle paden relatief aan de repo-root):
- docs/resources (demo scripts, toekomstige assets)
- docs/releases (release assets per versie)
- releases.json (root)
- CHANGELOG.md (root)

Padbehoud: een lokaal bestand `docs/resources/scripts/fountain/big-fish.fountain` wordt in de bucket `app-assets/docs/resources/scripts/fountain/big-fish.fountain`.

## Uitvoeren (lokaal)
1) Installeer dependencies (eenmalig):
```
npm install
```
2) Run upload:
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run upload-assets
```
- Upsert staat aan; herhaald draaien is veilig.
- Pas `ASSET_TARGETS` aan als je extra mappen wilt (bijv. `assets/photos`).

### Windows / PowerShell (aanrader)
Gebruik de helper zodat je geen env-var syntax hoeft te onthouden:
```
./scripts/upload-assets.ps1
```
Als plakken in de prompt lastig is: kopieer je key, druk Enter, en het script pakt hem uit je clipboard.

Of met parameters:
```
./scripts/upload-assets.ps1 -SupabaseUrl "https://xxxxx.supabase.co" -ServiceRoleKey "<service-role>" -Targets "docs/resources,docs/releases" -Concurrency 8
```
Je kan ook expliciet `-SecretKey` gebruiken:
```
./scripts/upload-assets.ps1 -SupabaseUrl "https://xxxxx.supabase.co" -SecretKey "<sb_secret_...>"
```
Als je liever zonder helper werkt:
```
$env:SUPABASE_URL = "https://xxxxx.supabase.co"
$env:SUPABASE_SECRET_KEY = "<sb_secret_...>"
npm run upload-assets
```

## Publieke URLs gebruiken
- Base: `<SUPABASE_URL>/storage/v1/object/public/app-assets/`.
- Voorbeeld: bestand `docs/resources/scripts/fountain/big-fish.fountain` → `https://<project>.supabase.co/storage/v1/object/public/app-assets/docs/resources/scripts/fountain/big-fish.fountain`.
- Frontend: stel `window.__ASSET_BASE_URL` of een `<meta name="assets-base-url" ...>` zodat code in [frontend/js/screens/ScriptImportScreen.js](frontend/js/screens/ScriptImportScreen.js) en [frontend/js/supabase-config.js](frontend/js/supabase-config.js) de juiste base gebruikt.
- Release notes: zelfde base mogelijk via `window.__RELEASES_BASE_URL` of `<meta name="releases-base-url" ...>` zoals gebruikt in [frontend/js/utils/releaseNotes.js](frontend/js/utils/releaseNotes.js).

## CI/CD integratie (voorbeeld)
- Voeg een job toe die na build draait.
```
name: Upload assets
run: |
  npm ci
  SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
  SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }} \
  npm run upload-assets
```
- Secrets in CI: alleen service role key in de pipeline, nooit in de frontend.

## Schaalbaarheid en onderhoud
- Concurrency is instelbaar via `ASSET_UPLOAD_CONCURRENCY` (start met 8; verhoog bij veel foto’s).
- MIME-types worden gezet via `mime`; levert correcte caching headers.
- Upserts maken het script herhaalbaar; combineer met een manifest (optioneel) voor cache-busting (`?v=<checksum>`).
- Houd bucket publiek voor leesverkeer; schrijf blijft via service role (alleen backend/CI). Voor client-side uploads later: werk met presigned URLs of aparte bucket/regels.

## Bestanden in deze setup
- Script: [scripts/upload-assets.mjs](scripts/upload-assets.mjs)
- Config consumptie in frontend: [frontend/js/supabase-config.js](frontend/js/supabase-config.js)
- Release notes fetching: [frontend/js/utils/releaseNotes.js](frontend/js/utils/releaseNotes.js)
