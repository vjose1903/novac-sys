const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const packagePath = path.join(root, 'package.json');
const setupPath = path.join(__dirname, 'setup.js');

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function getClientByBranch() {
  const setup = fs.readFileSync(setupPath, 'utf8');
  const clients = new Map();
  const blockPattern = /(^\s*)([a-zA-Z0-9_]+):\s*\{([\s\S]*?)^\s*\},/gm;

  for (const match of setup.matchAll(blockPattern)) {
    const branch = match[3].match(/RAMA:\s*'([^']+)'/);
    if (branch) clients.set(branch[1], match[2]);
  }

  const branch = git('branch', '--show-current');
  const client = clients.get(branch);
  if (!client) {
    throw new Error(`La rama "${branch}" no está asociada a ningún cliente en scripts/setup.js.`);
  }

  return client;
}

function calculateVersion(current, kind) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) throw new Error(`La versión actual "${current}" no tiene formato mayor.versión.parche.`);

  let [major, minor, patch] = match.slice(1).map(Number);
  if (kind === 'mayor') [major, minor, patch] = [major + 1, 0, 0];
  if (kind === 'version') [major, minor, patch] = [major, minor + 1, 0];
  if (kind === 'parche') patch += 1;
  return `${major}.${minor}.${patch}`;
}

async function askVersionKind(rl, current) {
  console.log('\n¿Qué número deseas actualizar?');
  console.log('  1. mayor   = cambio grande o incompatible (10.8.4 → 11.0.0)');
  console.log('  2. versión = nueva funcionalidad compatible (10.8.4 → 10.9.0)');
  console.log('  3. parche  = corrección o ajuste pequeño (10.8.4 → 10.8.5)');
  console.log(`\nVersión actual: ${current}`);

  const answer = (await rl.question('Elige 1, 2 o 3: '))
    .trim()
  const kindByChoice = { 1: 'mayor', 2: 'version', 3: 'parche' };
  if (!kindByChoice[answer]) throw new Error('Debes elegir 1, 2 o 3.');
  return kindByChoice[answer];
}

async function main() {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const client = getClientByBranch();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(`\nCliente a actualizar: ${client.toUpperCase()}`);
    const kind = await askVersionKind(rl, packageJson.version);
    const targetVersion = calculateVersion(packageJson.version, kind);
    console.log(`Nueva versión: ${targetVersion}`);
    const description = (await rl.question('¿Qué incluye esta actualización? ')).trim();
    if (!description) throw new Error('La descripción de la actualización no puede estar vacía.');

    packageJson.version = targetVersion;
    fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

    const summary = `*** PROXIMA ACTUALIZACION ${client.toUpperCase()} V${targetVersion} ***`;
    git('add', '-A');
    execFileSync('git', ['commit', '-m', summary, '-m', description], { cwd: root, stdio: 'inherit' });

    const branch = git('branch', '--show-current');
    execFileSync('git', ['push', 'origin', branch], { cwd: root, stdio: 'inherit' });

    const tag = `v${targetVersion}`;
    execFileSync('git', ['tag', tag], { cwd: root, stdio: 'inherit' });
    execFileSync('git', ['push', 'origin', tag], { cwd: root, stdio: 'inherit' });

    console.log(`\nActualización publicada: ${summary}`);
  } finally {
    rl.close();
  }
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
