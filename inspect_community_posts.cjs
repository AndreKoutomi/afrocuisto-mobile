const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('community_posts').select('*').limit(1);
    if (!error && data.length > 0) {
        console.log('Columns in community_posts:', Object.keys(data[0]));
    } else {
        console.error('Error or no data in community_posts:', error?.message);
    }
}
checkColumns();
