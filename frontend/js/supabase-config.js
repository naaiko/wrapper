// Supabase Configuration
// IMPORTANT: In production, move these to environment variables

const SUPABASE_URL = 'https://jdjwkidtslnqvfednuga.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yXeLZBTAvMzLPnlCDFbriw_L40Ex4ew';

// Initialize Supabase client
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
