const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';

const anon = createClient(SUPABASE_URL, ANON_KEY);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
    console.log('\n=== 1. Colonnes de user_profiles ===');
    const { data: cols1 } = await admin.from('user_profiles').select('*').limit(1);
    if (cols1 && cols1.length > 0) console.log(Object.keys(cols1[0]));
    else console.log('Table vide ou inaccessible');

    console.log('\n=== 2. Colonnes de community_posts ===');
    const { data: cols2 } = await admin.from('community_posts').select('*').limit(1);
    if (cols2 && cols2.length > 0) console.log(Object.keys(cols2[0]));
    else console.log('Table vide ou inaccessible');

    console.log('\n=== 3. Lecture des posts existants (admin) ===');
    const { data: postList, error: postErr } = await admin
        .from('community_posts')
        .select('*, user_profiles(name)')
        .order('created_at', { ascending: false })
        .limit(5);
    if (postErr) console.error('Erreur lecture posts:', postErr.message, postErr.details, postErr.hint);
    else console.log(`${postList?.length} post(s) trouvé(s):`, postList?.map(p => ({ id: p.id, content: p.content?.substring(0, 30), user_id: p.user_id })));

    console.log('\n=== 4. Récupérer le premier user de user_profiles ===');
    const { data: users, error: usersErr } = await admin.from('user_profiles').select('id, name, email').limit(1);
    if (usersErr) console.error('Erreur user_profiles:', usersErr.message);
    else if (!users || users.length === 0) { console.log('Aucun utilisateur. Création impossible.'); return; }
    else console.log('Utilisateur test:', users[0]);

    const testUserId = users[0].id;

    console.log('\n=== 5. Test création de post (anon) ===');
    const { data: newPost, error: insertErr } = await anon
        .from('community_posts')
        .insert([{
            user_id: testUserId,
            title: 'Test post debug',
            content: 'Ceci est un post de test automatique.',
            category: 'Autre',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (insertErr) console.error('❌ Erreur insertion (anon):', insertErr.message, '| code:', insertErr.code, '| details:', insertErr.details);
    else console.log('✅ Post créé avec anon key:', newPost?.id);

    console.log('\n=== 6. Test création de post (service_role) ===');
    const { data: newPost2, error: insertErr2 } = await admin
        .from('community_posts')
        .insert([{
            user_id: testUserId,
            title: 'Test post debug (admin)',
            content: 'Ceci est un post inséré via service_role.',
            category: 'Autre',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    if (insertErr2) console.error('❌ Erreur insertion (admin):', insertErr2.message, '| code:', insertErr2.code);
    else console.log('✅ Post créé avec service_role:', newPost2?.id);

    console.log('\n=== 7. Lecture finale des posts (admin) ===');
    const { data: finalPosts, error: finalErr } = await admin
        .from('community_posts')
        .select('id, title, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    if (finalErr) console.error('Erreur:', finalErr.message);
    else console.log(`Total visible via admin: ${finalPosts?.length} posts`);
}

main().catch(console.error);
