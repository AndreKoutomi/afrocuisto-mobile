const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const report = {
        user_name: 'Test',
        user_email: 'test@example.com',
        title: 'Bouton bloqué',
        description: 'Bloqué',
        severity: 'Mineur',
        category: 'Interface',
        status: 'Nouveau',
    };
    console.log("Attempting insert...");
    const { data, error } = await supabase.from('bug_reports').insert([report]);
    if (error) {
        console.error('Insert Error:', error.message, error.code, error.details, error.hint);
    } else {
        console.log('Insert succeeded:', data);
    }
}
check();
