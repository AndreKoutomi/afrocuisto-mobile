const { createClient } = require('@supabase/supabase-js');

const url = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('waitlist').select('*').limit(1);
    if (error) {
        console.log('Error checking waitlist table:', error.message);
    } else {
        console.log('Waitlist table exists and is accessible.');
    }
}

check();
