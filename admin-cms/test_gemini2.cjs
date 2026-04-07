const https = require('https');

const key = "AIzaSyCFGocXOWqPV7YHJMp2A81AnPRE_8OQP9c";
const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
