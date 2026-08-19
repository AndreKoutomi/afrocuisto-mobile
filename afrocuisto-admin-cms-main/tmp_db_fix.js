
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/AfriHub/admin-cms/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase variables are missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
    console.log('Attempting to add columns...');
    const { data, error } = await supabase.rpc('add_columns_to_merchants_if_missing');

    if (error) {
        console.warn('RPC failed, probably function not exists. Trying direct raw SQL if possible (rare via JS SDK)...');
        // Usually, raw SQL isn't exposed via SDK. 
        // We might need to handle this differently if RPC isn't available.
        console.error(error);
    } else {
        console.log('Success:', data);
    }
}

// Since direct raw SQL is better, let's try a common trick if the user has access.
// But usually, we only have table access.
addColumns();
