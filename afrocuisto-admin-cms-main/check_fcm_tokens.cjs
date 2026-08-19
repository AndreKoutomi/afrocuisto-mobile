const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erreur : Variables d'environnement manquantes dans admin-cms/.env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTokens() {
    console.log("🔍 Vérification des jetons FCM enregistrés...");

    // 1. Vérifier si la table existe et contient des données
    const { data, error, count } = await supabase
        .from('user_fcm_tokens')
        .select('*', { count: 'exact' });

    if (error) {
        if (error.code === '42P01') {
            console.error("❌ ERREUR : La table 'user_fcm_tokens' n'existe pas dans votre base de données.");
            console.log("👉 Action : Exécutez le script SQL fourni dans l'artifact 'supabase_fcm_setup.md'.");
        } else {
            console.error("❌ Erreur Supabase :", error.message);
        }
        return;
    }

    if (!data || data.length === 0) {
        console.warn("⚠️  ATTENTION : Aucun jeton FCM trouvé dans la table 'user_fcm_tokens'.");
        console.log("👉 Action : Ouvrez l'application AfroCuisto sur votre téléphone connecté à Internet pour capturer un jeton.");
    } else {
        console.log(`✅ SUCCÈS : ${count} jeton(s) trouvé(s) !`);
        data.forEach((t, i) => {
            console.log(`  [${i + 1}] User ID: ${t.user_id} | Platform: ${t.platform} | Token: ${t.token.substring(0, 15)}...`);
        });
    }
}

checkTokens();
