const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

console.log('\x1b[34m[Setup]\x1b[0m Starting project dependency setup...\n');

// 1. Install NPM Dependencies
console.log('\x1b[34m[Setup]\x1b[0m Installing Node.js packages...');
try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
    console.log('\x1b[32m[Setup]\x1b[0m Node.js packages installed successfully.\n');
} catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Failed to install Node.js packages.');
    process.exit(1);
}

// 2. Locate / Create Python Virtual Environment
const venvDir = path.join(rootDir, 'venv');
const venvPythonBin = isWindows 
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');

if (!fs.existsSync(venvDir)) {
    console.log('\x1b[34m[Setup]\x1b[0m Creating Python virtual environment (venv)...');
    let pythonSystemCmd = isWindows ? 'python' : 'python3';
    try {
        execSync(`${pythonSystemCmd} -m venv venv`, { cwd: rootDir, stdio: 'inherit' });
        console.log('\x1b[32m[Setup]\x1b[0m Virtual environment created at ./venv\n');
    } catch (err) {
        console.error('\x1b[31m[ERROR]\x1b[0m Failed to create Python virtual environment.');
        console.error('Make sure Python 3.10+ is installed and accessible in system PATH.\n');
        process.exit(1);
    }
} else {
    console.log('\x1b[32m[Setup]\x1b[0m Found existing virtual environment at ./venv\n');
}

// 3. Install Python requirements.txt
console.log('\x1b[34m[Setup]\x1b[0m Installing Python dependencies from requirements.txt...');
try {
    const reqPath = path.join(rootDir, 'requirements.txt');
    execSync(`"${venvPythonBin}" -m pip install --upgrade pip`, { cwd: rootDir, stdio: 'inherit' });
    execSync(`"${venvPythonBin}" -m pip install -r "${reqPath}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log('\x1b[32m[Setup]\x1b[0m Python dependencies installed successfully.\n');
} catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Failed to install Python dependencies.');
    process.exit(1);
}

console.log('\x1b[32m[Setup Complete]\x1b[0m All dependencies are ready!');
console.log('\x1b[36mTo start the app, run:\x1b[0m');
console.log('  npm run dev\n');
