const http = require('http');
const url = require('url');

let dictionary = [];
let requestCount = 0;

const server = http.createServer((req, res) => {
    requestCount++;

    // Enable CORS for all origins (GitHub Pages + others)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/definitions' && req.method === 'GET') {
        const word = parsedUrl.query.word?.toLowerCase();
        const entry = dictionary.find(item => item.word === word);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entry ? 
            { definition: entry.definition, requestCount } : 
            { message: `Word "${word}" not found.`, requestCount }
        ));
    }

    else if (parsedUrl.pathname === '/api/definitions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const word = data.word?.toLowerCase();
                const definition = data.definition;

                if (!word || !definition) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid input.', requestCount }));
                    return;
                }

                const existing = dictionary.find(item => item.word === word);
                if (existing) {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: `Warning! "${word}" already exists.`, requestCount }));
                    return;
                }

                dictionary.push({ word, definition });
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: `New entry recorded: "${word}"`,
                    totalEntries: dictionary.length,
                    requestCount
                }));

            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid JSON format.', requestCount }));
            }
        });
    }

    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Endpoint not found.', requestCount }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
