const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = fs.readFileSync('supabase_single_device_sessions.sql', 'utf8');

async function run() {
  try {
    // Attempt to execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/x_run_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (response.ok) {
       console.log('SQL executed using direct fetch RPC');
    } else {
       console.warn('Cannot execute SQL via direct RPC, user must run it manually in Supabase Dashboard.');
       console.log(await response.text());
    }
  } catch(e) {
    console.error('Erreur', e)
  }
}
run();
