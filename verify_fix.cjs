/**
 * Script pour appliquer la FK manquante via l'API Supabase Management
 * La FK entre community_posts.user_id et user_profiles.id est absente,
 * causant l'échec de toutes les jointures PostgREST.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIxNzk5MSwiZXhwIjoyMDg3NzkzOTkxfQ.7tYsh8vXStkJqhk4T-IA6rYgONJ7evPEFbbpfHR1fDc';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function applyFix() {
    console.log('=== Application du correctif base de données ===\n');

    // Test de lecture des posts SANS jointure (doit fonctionner)
    console.log('1. Test lecture posts (sans jointure)...');
    const { data: posts, error: postsErr } = await admin
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (postsErr) {
        console.error('❌ Impossible de lire les posts:', postsErr.message);
    } else {
        console.log(`✅ ${posts?.length} posts lus avec succès.`);
        if (posts?.length > 0) {
            console.log('   Dernier post:', {
                id: posts[0].id,
                content: posts[0].content?.substring(0, 40),
                user_id: posts[0].user_id,
                created_at: posts[0].created_at
            });
        }
    }

    // Test de lecture des profils
    console.log('\n2. Test lecture profils utilisateurs...');
    const { data: profiles, error: profilesErr } = await admin
        .from('user_profiles')
        .select('id, name, avatar, phone, is_admin')
        .limit(3);

    if (profilesErr) {
        console.error('❌ Erreur profils:', profilesErr.message);
    } else {
        console.log(`✅ ${profiles?.length} profils lus.`);
        if (profiles?.length > 0) {
            console.log('   Colonnes disponibles:', Object.keys(profiles[0]));
        }
    }

    // Test d'insertion d'un post complet (simulation app mobile)
    if (profiles && profiles.length > 0) {
        const testUserId = profiles[0].id;
        console.log(`\n3. Test insertion post (user_id: ${testUserId})...`);
        const { data: newPost, error: insertErr } = await admin
            .from('community_posts')
            .insert([{
                user_id: testUserId,
                title: 'Post de vérification',
                content: 'Ceci est un post de vérification automatique. Supprimez-le si vous le voyez.',
                category: 'Autre',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (insertErr) {
            console.error('❌ Erreur insertion:', insertErr.message, '| Code:', insertErr.code, '| Détails:', insertErr.details);
        } else {
            console.log('✅ Post inséré avec succès, ID:', newPost?.id);

            // Nettoyer le post de test
            await admin.from('community_posts').delete().eq('id', newPost?.id);
            console.log('   (Post de test supprimé)');
        }
    }

    // Compter le total des posts
    const { count, error: countErr } = await admin
        .from('community_posts')
        .select('*', { count: 'exact', head: true });
    if (!countErr) console.log(`\n📊 Total posts dans la base: ${count}`);

    console.log('\n=== Diagnostic terminé ===');
    console.log('\n⚠️  ACTION REQUISE dans Supabase SQL Editor:');
    console.log('Exécutez le contenu de supabase_fix_fk.sql pour ajouter');
    console.log('la clé étrangère (FK) manquante entre community_posts et user_profiles.');
    console.log('Cela permettra aux jointures PostgREST de fonctionner.');
}

applyFix().catch(console.error);
