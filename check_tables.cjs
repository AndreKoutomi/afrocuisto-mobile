const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResources() {
    console.log('--- Testing Database Resources ---');

    // 1. Check for 'dish_suggestions' directly
    console.log('\nChecking table: dish_suggestions...');
    const { error: dishError } = await supabase.from('dish_suggestions').select('*').limit(0);
    const { count, error: countErr } = await supabase.from('community_posts').select('*', { count: 'exact', head: true });
    if (!countErr) {
        console.log(`✅ Table "community_posts" has ${count} rows.`);
    } else {
        console.error('❌ Table "community_posts" count failed:', countErr.message);
    }

    const { count: usersCount, error: usersErr } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    if (!usersErr) {
        console.log(`✅ Table "user_profiles" has ${usersCount} rows.`);
    } else {
        console.error('❌ Table "user_profiles" count failed:', usersErr.message);
    }

    if (dishError) {
        console.error('❌ Table "dish_suggestions" NOT FOUND (Error:', dishError.message, ')');
    } else {
        console.log('✅ Table "dish_suggestions" IS ACCESSIBLE.');
    }

    // 2. Check for ANY table starting with 'dish' or 'suggestion'
    console.log('\nScanning for similar tables...');
    try {
        // Query to list all tables in public schema
        // Note: information_schema.tables might not be accessible with anon key
        // We'll try a common one that should exist
        const { data: tables, error: tablesError } = await supabase
            .rpc('list_tables'); // custom rpc if exists

        if (tablesError) {
            console.log('Could not list tables via RPC. Trying direct schema query...');
            const { data: schemaTables, error: schemaError } = await supabase
                .from('pg_tables') // Usually not accessible via PostgREST
                .select('tablename')
                .eq('schemaname', 'public');

            if (schemaError) {
                console.log('Could not query tables directly. Attempting to probe common names...');
                const probes = ['dish_suggestions', 'community_posts', 'user_profiles', 'post_comments', 'post_likes', 'post_reports'];
                for (const probe of probes) {
                    const { error } = await supabase.from(probe).select('*').limit(0);
                    if (!error) console.log(`✅ FOUND: "${probe}"`);
                    else console.log(`❌ probed "${probe}":`, error.message);
                }
            } else {
                console.log('Available tables:', schemaTables.map(t => t.tablename).join(', '));
            }
        } else {
            console.log('Available tables:', tables);
        }
    } catch (e) {
        console.error('Scan failed:', e.message);
    }
}

checkResources();
