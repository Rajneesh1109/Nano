
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// We trim the values to prevent "fetch failed" caused by accidental spaces in Render
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL ERROR: Supabase credentials missing from environment variables.");
    console.log("Check Render Dashboard -> Environment tab.");
} else {
    console.log(`Supabase initialized with URL: ${supabaseUrl.substring(0, 15)}...`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
