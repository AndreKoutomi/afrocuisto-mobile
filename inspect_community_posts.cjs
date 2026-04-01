const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ewoiqbhqtcdatpzhdaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2lxYmhxdGNkYXRwemhkYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc5OTEsImV4cCI6MjA4Nzc5Mzk5MX0.VN3pnUz2pO5nQ4DUZ8_Ml1OAwg_jIUh3mwn-pvrtyh8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    console.log('--- Checking community_posts ---');
    const { data: posts, error: pError } = await supabase.from('community_posts').select('*').limit(5);
    if (pError) {
        console.error('Error fetching posts:', pError.message);
        return;
    }
    console.log('Fetched', posts.length, 'posts');
    console.log(JSON.stringify(posts, null, 2));

    if (posts.length > 0) {
        const postIds = posts.map(p => p.id);
        console.log('--- Checking post_likes total count ---');
        const { data: allLikes, error: alError } = await supabase
            .from('post_likes')
            .select('post_id')
            .in('post_id', postIds);
        
        if (alError) console.error('Error fetching total likes:', alError.message);
        else console.log('Fetched total likes:', allLikes.length);

        const userIds = posts.map(p => p.user_id).filter(Boolean);
        console.log('--- Checking user_profiles for authors ---');
        const { data: profiles, error: prError } = await supabase
            .from('user_profiles')
            .select('id, name, avatar')
            .in('id', userIds);
        
        if (prError) console.error('Error fetching profiles:', prError.message);
        else console.log('Fetched profiles:', profiles.length);

        console.log('--- Checking post_comments for the same posts ---');
        const { data: comments, error: cError } = await supabase
            .from('post_comments')
            .select('*')
            .in('post_id', postIds);
        
        if (cError) console.error('Error fetching comments:', cError.message);
        else {
            console.log('Fetched', comments.length, 'comments');
            console.log(JSON.stringify(comments, null, 2));
        }
    }
}
checkAll();
