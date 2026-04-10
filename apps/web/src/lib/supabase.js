
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'x';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        flowType: 'implicit',
    }
});
