export async function onRequestPost({ request }) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email invalide' }), { status: 400 });
    }

    // --- OPTION : ENVOI D'EMAIL RÉEL AVEC MAILCHANNELS (Gratuit sur CF Workers) ---
    // Cette partie fonctionnera une fois déployée sur Cloudflare Pages.
    // Elle vous envoie un email à chaque nouvelle inscription.

    // Décommentez les lignes suivantes pour activer l'envoi d'email réel:

    const sendEmail = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: 'hello@afrocuisto.app', name: 'Admin AfroCuisto' }] }],
        from: { email: 'no-reply@afrocuisto.app', name: 'Waitlist Bot' },
        subject: 'Nouvelle inscription Waitlist !',
        content: [{
          type: 'text/plain',
          value: `Un nouvel utilisateur s'est inscrit : ${email}`
        }],
      }),
    });


    // --- OPTION : STOCKAGE EN BASE DE DONNÉES (Facultatif) ---
    // Si vous configurez une DB KV ou D1 sur Cloudflare, vous pouvez stocker l'email ici.
    // await env.WAITLIST_DB.put(email, new Date().toISOString());

    return new Response(JSON.stringify({ success: true, message: 'Inscription enregistrée sur Cloudflare' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur', details: err.message }), { status: 500 });
  }
}
