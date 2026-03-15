
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'admin-cms', '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function inspectRecipes() {
    const { data, error } = await supabase.from('recipes').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Recipe Columns found:', Object.keys(data[0] || {}));
}

inspectRecipes();
