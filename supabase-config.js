// Supabase Configuration
// Fill in your Supabase project credentials below

module.exports = {
    // Your Supabase project URL (from Project Settings > API)
    SUPABASE_URL: 'https://qwgukuukwkdfjcmxmequ.supabase.co',

    // Your Supabase anon/public key (from Project Settings > API)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z3VrdXVrd2tkZmpjbXhtZXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NTY3NzIsImV4cCI6MjA4NTMzMjc3Mn0.Mvft-owRWh1XoZUBbYz4-TD3-4Fiywg7KEe7A3qoju8',

    // Table names in Supabase
    TABLES: {
        COOKIES: 'cookies',        // Table to store cookies
        APP_CONFIG: 'app_config',  // Table to store app link and other config
        SUPERUSERS: 'superusers'   // Table to store admin accounts
    }
};
