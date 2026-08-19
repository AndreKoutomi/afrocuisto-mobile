const https = require('https');

const key = process.env.VITE_GEMINI_API_KEY;
const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models?key=${key}`,
    method: 'GET',
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
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(', ')})`));
            } else {
                console.log("No models field in response.");
                console.log(data);
            }
        } catch (e) {
            console.log("Failed to parse response.");
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
