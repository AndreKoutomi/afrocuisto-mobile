require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkId() {
    const { data, error } = await supabase.from('recipes').select('id').limit(1);
    if (error) {
        console.error("Select error:", error);
    } else if (data && data.length > 0) {
        console.log("ID example:", data[0].id);
    }
}

checkId();
