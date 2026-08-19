const https = require('https');

const key = process.env.VITE_GEMINI_API_KEY;
const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status Status: ${res.statusCode}`);
        console.log(`Body: ${data}`);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }],
    generationConfig: { temperature: 0.8 }
}));
req.end();
