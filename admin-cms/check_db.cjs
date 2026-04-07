
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/AfriHub/admin-cms/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking for products table...');
    const { data, error } = await supabase.from('products').select('*').limit(1);

    if (error) {
        console.error('Error checking table:', error.message);
        if (error.code === '42P01') {
            console.log('Table "products" does not exist.');
        }
    } else {
        console.log('Table "products" exists and has data:', data);
    }
}

checkTable();
