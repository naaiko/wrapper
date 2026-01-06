// Supabase Configuration
// IMPORTANT: In production, move these to environment variables

const SUPABASE_URL = 'https://jdjwkidtslnqvfednuga.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yXeLZBTAvMzLPnlCDFbriw_L40Ex4ew';

// Public storage base for static assets (release notes, demo scripts, future photos)
// Bucket name is configurable; default keeps file structure identical to /docs/resources in the repo.
const SUPABASE_STORAGE_BUCKET = 'app-assets';
const SUPABASE_STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`;

// Always expose Storage bases (these are used by ReleaseNotes + demo scripts).
// Keep local overrides possible (we only set them when not already provided).
if (!window.__ASSET_BASE_URL) {
	window.__ASSET_BASE_URL = SUPABASE_STORAGE_BASE;
}

// Release notes share the same storage base by default; can still be overridden via meta/global.
if (!window.__RELEASES_BASE_URL) {
	window.__RELEASES_BASE_URL = SUPABASE_STORAGE_BASE;
}

// Initialize Supabase client (best-effort).
// The CDN UMD bundle typically exposes window.supabase.createClient.
try {
	if (window.supabase && typeof window.supabase.createClient === 'function') {
		window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	} else {
		console.warn('[SUPABASE] supabase-js global not found; skipping client init. Storage URLs still configured.');
	}
} catch (err) {
	console.warn('[SUPABASE] Failed to initialize client; Storage URLs still configured.', err);
}
