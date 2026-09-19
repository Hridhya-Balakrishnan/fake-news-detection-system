const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const HOST = '127.0.0.1';
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];

    let filePath;
    if (reqUrl === '/' || reqUrl === '/index.html') {
        filePath = path.join(appDir, 'templates', 'index.html');
    } else if (reqUrl.startsWith('/static/')) {
        const relativeStaticPath = reqUrl.substring('/static/'.length);
        filePath = path.join(appDir, 'static', relativeStaticPath);
    } else {
        filePath = path.join(appDir, reqUrl);
    }

    // Security check to prevent directory traversal
    if (!filePath.startsWith(appDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`404 Not Found: ${req.url}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\x1b[35m[Frontend]\x1b[0m Development server running at http://${HOST}:${PORT}`);
});
