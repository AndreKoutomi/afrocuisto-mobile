const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
    const { data, error } = await supabase.from('bug_reports').select('id, title, screenshot').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error('Error:', error.message);
    } else {
        data.forEach(r => {
            console.log(`ID: ${r.id}, Title: ${r.title}, Screenshot Length: ${r.screenshot ? r.screenshot.length : 0}`);
            if (r.screenshot) {
                console.log(`Prefix: ${r.screenshot.substring(0, 50)}...`);
            }
        });
    }
}
check();
