const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

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

    // Fallback to system python
    try {
        execSync(isWindows ? 'where python' : 'which python3 || which python', { stdio: 'ignore' });
        return isWindows ? 'python' : (process.platform === 'win32' ? 'python' : 'python3');
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

function startBackend() {
    const pythonBin = findPythonExecutable();
    verifyPythonEnvironment(pythonBin);

    console.log(`\x1b[36m[Backend]\x1b[0m Starting FastAPI application on http://127.0.0.1:8000...`);
    console.log(`\x1b[36m[Backend]\x1b[0m Using Python: ${pythonBin}`);

    const uvicornArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

    const backendProcess = spawn(pythonBin, uvicornArgs, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false
    });

    backendProcess.on('error', (err) => {
        console.error(`\x1b[31m[Backend Error]\x1b[0m Failed to start backend server: ${err.message}`);
        process.exit(1);
    });

    backendProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`\x1b[31m[Backend]\x1b[0m Process exited with code ${code}`);
        }
    });
}

startBackend();
