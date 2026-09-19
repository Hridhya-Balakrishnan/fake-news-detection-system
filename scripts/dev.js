const { spawn, exec, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');

const FRONTEND_PORT = 5500;
const FRONTEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';
const APP_URL = `http://localhost:${FRONTEND_PORT}`;
const API_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

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

let backendProcess = null;
let frontendServer = null;
let isShuttingDown = false;

function findPythonExecutable() {
    const isWindows = process.platform === 'win32';
    const venvPythonWin = path.join(rootDir, 'venv', 'Scripts', 'python.exe');
    const venvPythonUnix = path.join(rootDir, 'venv', 'bin', 'python');

    if (isWindows && fs.existsSync(venvPythonWin)) {
        return venvPythonWin;
    }
    if (!isWindows && fs.existsSync(venvPythonUnix)) {
        return venvPythonUnix;
    }

    try {
        execSync(isWindows ? 'where python' : 'which python3 || which python', { stdio: 'ignore' });
        return isWindows ? 'python' : 'python3';
    } catch {
        return null;
    }
}

function verifyPythonEnvironment(pythonBin) {
    if (!pythonBin) {
        console.error('\x1b[31m[ERROR] Python executable not found!\x1b[0m');
        console.error('Please install Python 3.10+ or run "npm run setup" to create a virtual environment.\n');
        process.exit(1);
    }

    try {
        execSync(`"${pythonBin}" -c "import fastapi, uvicorn"`, { stdio: 'ignore' });
    } catch (err) {
        console.error('\x1b[31m[ERROR] Required Python packages (fastapi, uvicorn) are missing!\x1b[0m');
        console.error(`Using Python: ${pythonBin}`);
        console.error('Please run "npm run setup" or "pip install -r requirements.txt" to install dependencies.\n');
        process.exit(1);
    }
}

function openBrowser(url) {
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    let cmd = isWindows ? `start "" "${url}"` : isMac ? `open "${url}"` : `xdg-open "${url}"`;

    exec(cmd, (err) => {
        if (err) {
            console.log(`\x1b[33m[Browser]\x1b[0m Could not open browser automatically: ${err.message}`);
            console.log(`\x1b[33m[Browser]\x1b[0m Please manually navigate to ${url}`);
        }
    });
}

function startFrontend() {
    return new Promise((resolve, reject) => {
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

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\x1b[31m[Frontend Error]\x1b[0m Port ${FRONTEND_PORT} is already in use!`);
            } else {
                console.error(`\x1b[31m[Frontend Error]\x1b[0m Server error: ${err.message}`);
            }
            reject(err);
        });

        server.listen(FRONTEND_PORT, FRONTEND_HOST, () => {
            frontendServer = server;
            resolve();
        });
    });
}

function startBackend() {
    const pythonBin = findPythonExecutable();
    verifyPythonEnvironment(pythonBin);

    const uvicornArgs = ['-m', 'uvicorn', 'app.main:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT), '--reload'];

    backendProcess = spawn(pythonBin, uvicornArgs, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false
    });

    backendProcess.on('error', (err) => {
        if (!isShuttingDown) {
            console.error(`\x1b[31m[Backend Error]\x1b[0m Failed to start backend server: ${err.message}`);
            shutdown(1);
        }
    });

    backendProcess.on('exit', (code) => {
        if (!isShuttingDown && code !== 0 && code !== null) {
            console.error(`\x1b[31m[Backend Error]\x1b[0m Process crashed with exit code ${code}`);
            shutdown(code);
        }
    });
}

function shutdown(exitCode = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n\x1b[36m[Dev]\x1b[0m Stopping backend and frontend servers gracefully...');

    if (frontendServer) {
        try {
            frontendServer.close();
        } catch {}
    }

    if (backendProcess && backendProcess.pid) {
        if (process.platform === 'win32') {
            try {
                execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
            } catch {
                try { backendProcess.kill(); } catch {}
            }
        } else {
            try { backendProcess.kill('SIGINT'); } catch {}
        }
    }

    setTimeout(() => {
        process.exit(exitCode);
    }, 200);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('SIGHUP', () => shutdown(0));

async function main() {
    console.log('\x1b[36m[Dev]\x1b[0m Starting AI Fake News Detection development environment...\n');

    try {
        startBackend();
        await startFrontend();

        console.log('\n\x1b[32m============================================================\x1b[0m');
        console.log('\x1b[1m\x1b[32m  🚀 Fake News Detection System is Running!\x1b[0m');
        console.log('');
        console.log(`  \x1b[1mFrontend App URL :\x1b[0m \x1b[36m\x1b[4m${APP_URL}\x1b[0m`);
        console.log(`  \x1b[1mBackend API URL  :\x1b[0m \x1b[35m${API_URL}\x1b[0m`);
        console.log('');
        console.log('  Press \x1b[33mCtrl+C\x1b[0m to stop all servers gracefully.');
        console.log('\x1b[32m============================================================\x1b[0m\n');

        openBrowser(APP_URL);
    } catch (err) {
        console.error(`\x1b[31m[Dev Error]\x1b[0m Failed to start environment: ${err.message}`);
        shutdown(1);
    }
}

main();
