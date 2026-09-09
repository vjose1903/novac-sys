const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const mode = process.argv[2];
const rootPath = path.join(__dirname, '..');
const runtimeConfigPath = path.join(rootPath, 'electron', 'main-runtime-config.json');

function getPort() {
  const config = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
  const port = Number(config.port);
  if (!Number.isInteger(port) || port <= 0) throw new Error('Puerto inválido en electron/main-runtime-config.json');
  return port;
}

function command(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function run(commandName, args) {
  const child = spawn(commandName, args, { cwd: rootPath, stdio: 'inherit' });
  child.on('exit', code => process.exit(code ?? 0));
  child.on('error', error => {
    console.error(`No se pudo iniciar ${commandName}:`, error);
    process.exit(1);
  });
}

function runAndWait(commandName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName, args, { cwd: rootPath, stdio: 'inherit' });
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${commandName} terminó con código ${code}`))));
    child.on('error', reject);
  });
}

function waitForPort(port) {
  return new Promise(resolve => {
    const attempt = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => setTimeout(attempt, 250));
    };
    attempt();
  });
}

async function main() {
  const port = getPort();
  const ngCli = path.join(rootPath, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  const electronCli = path.join(rootPath, 'node_modules', 'electron', 'cli.js');

  if (mode === 'ng') {
    run(process.execPath, [ngCli, 'serve', '--host', '0.0.0.0', '--port', String(port), '-c', 'dev', '--live-reload', '--hmr']);
    return;
  }

  if (mode === 'electron') {
    await waitForPort(port);
    await runAndWait(command('npm'), ['run', 'electron:serve-tsc']);
    run(process.execPath, [electronCli, '.', '--serve']);
    return;
  }

  throw new Error('Modo inválido. Usa "ng" o "electron".');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
