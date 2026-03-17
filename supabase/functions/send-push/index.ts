import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

/**
 * AfroCuisto - Service de Notification Push
 * Gère l'envoi de messages via Firebase Cloud Messaging (FCM) v1
 */

interface NotificationPayload {
    user_id: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

serve(async (req) => {
    // CORS - Autoriser les requêtes depuis l'app
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const payload: NotificationPayload = await req.json()
        const { user_id, title, body, data } = payload

        // 1. Initialiser le client Supabase avec la clé de service (Service Role)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 2. Récupérer le token FCM de l'utilisateur visé
        const { data: profile, error: dbError } = await supabaseClient
            .from('user_profiles')
            .select('push_token')
            .eq('id', user_id)
            .single()

        if (dbError || !profile?.push_token) {
            console.error("Aucun token trouvé pour l'utilisateur:", user_id);
            return new Response("User has no push token", { status: 404 })
        }

        // 3. Obtenir un jeton d'accès Google pour FCM v1
        const accessToken = await getGoogleAccessToken()

        // 4. Envoyer la notification à Google (FCM)
        const fcmProjectId = Deno.env.get('FCM_PROJECT_ID')
        const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: {
                    token: profile.push_token,
                    notification: { title, body },
                    data: data || {},
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default",
                            click_action: "OPEN_APP_NOTIFICATION"
                        }
                    }
                }
            })
        })

        const result = await fcmResponse.json()
        if (!fcmResponse.ok) {
            console.error("Erreur FCM:", result);
            return new Response(JSON.stringify(result), { status: fcmResponse.status })
        }

        return new Response(JSON.stringify({ success: true, message_id: result.name }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error("Erreur critique:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

/**
 * Génère un jeton JWT pour s'authentifier auprès de l'API Google
 */
async function getGoogleAccessToken() {
    const clientEmail = Deno.env.get('FCM_CLIENT_EMAIL')!
    const privateKey = Deno.env.get('FCM_PRIVATE_KEY')!.replace(/\\n/g, '\n')
    const scope = "https://www.googleapis.com/auth/firebase.messaging"

    const header = { alg: "RS256", typ: "JWT" }
    const now = Math.floor(Date.now() / 1000)

    const payload = {
        iss: clientEmail,
        sub: clientEmail,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: scope,
    }

    // Import de la clé privée au format CryptoKey
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.substring(pemHeader.length, privateKey.length - pemFooter.length).replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    )

    const jwt = await create(header, payload, key)

    // Échanger le JWT contre un Access Token
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    })

    const data = await response.json()
    return data.access_token
}
