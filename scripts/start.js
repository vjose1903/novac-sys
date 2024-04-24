var { execSync } = require('child_process');
var fs = require('fs');
var chalk = require('chalk');
var path = require('path');

const green = chalk.green;
const red = chalk.red;
const white = chalk.white;
const yellow = chalk.yellow;
const cyan = chalk.cyan;

let PRODUCTION = 'no';

function getActualClient() {
  const cliente = fs.readFileSync(pathAdd('../config_setup/actual_cliente.txt'), 'utf8').trim();
  console.log('\n');
  console.log(`${green(' ||-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=||')}`);
  console.log(`${green(' ||          ')}${white('CLIENTE ACTUAL')}${green('          ||')}`);
  console.log(`${green(' ||-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=||')}`);
  console.log('\n');
  console.log(`${white('  ')}${cliente}`);
  console.log('\n');
}

function setClient(client) {
  const nivel = PRODUCTION === 'no' ? 'dev' : 'prod';

  console.log(`${cyan('setClient >>')} ${client}`);
  console.log(`${green('nivel >>')} ${nivel}`);
  console.log(`${white('\n')}`);

  if (['agrodemi', 'brendy', 'vasquez', 'demo'].includes(client)) {
    if (fs.existsSync(pathAdd('../app_config.config'))) fs.unlinkSync(pathAdd('../app_config.config'));
    execSync(`node ${pathAdd('./setup.js')} ${client} ${nivel}`, { stdio: 'inherit' });
  } else {
    console.log(`${red('*************************************')}`);
    console.log(`${red('**                                 **')}`);
    console.log(`${red('**      CLIENTE NO ENCONTRADO      **')}`);
    console.log(`${red('**                                 **')}`);
    console.log(`${red('*************************************')}`);
    process.exit(2);
  }
}

function setRunPart(run) {
  console.log(`${yellow('run >>')} ${run}`);
  console.log(`${white('\n')}`);

  if (['electron', 'ng', 'all'].includes(run)) {
    switch (run) {
      case 'ng':
        npmCommand('ng:serve');
        break;
      case 'electron':
        npmCommand('electron:serve');
        break;
      case 'all':
        npmCommand('start');
        break;
      default:
        process.exit(2);
    }
  } else {
    console.log(`${red('**************************************')}`);
    console.log(`${red('**                                  **')}`);
    console.log(`${red('**      RUN PART NO ENCONTRADO      **')}`);
    console.log(`${red('**                                  **')}`);
    console.log(`${red('**************************************')}`);
    process.exit(2);
  }
}

function npmCommand(command) {
  console.log(`${cyan('command ...')} ${command}`);
  console.log(`${white('\n')}`);

  execSync(`npm run ${command}`, { stdio: 'inherit' });
}

function removeItemAtIndex(array, index) {
  if (index >= 0 && index < array.length) {
    array.splice(index, 1);
  } else {
    console.log(`${red('Índice fuera de rango.')}`);
  }
}

function pathAdd(str_path) {
  const path_resolved = path.join(__dirname, str_path);
  return path_resolved;
}

const args = process.argv.slice(2);
args.forEach((opt) => {
  console.log('\n');

  switch (opt) {
    case '-a':
      console.log('la opcion -a');
      getActualClient();
      break;
    case '-p':
      console.log('la opcion -p');
      PRODUCTION = 'yes';
      console.log(`${white('\n')}`);
      console.log(`${yellow(' -=-=-=- EJECUTANDO EN PRODUCCION -=-=-=-')}${white('\n')}`);
      console.log(`${white('\n')}`);
      break;
    case '-c':
      console.log('la opcion -c');
      const clientIndex = args.indexOf('-c') + 1;
      if (clientIndex < args.length) {
        setClient(args[clientIndex]);
        removeItemAtIndex(args, clientIndex)
      }
      break;
    case '-r':
      console.log('la opcion -r');
      const runIndex = args.indexOf('-r') + 1;
      if (runIndex < args.length) {
        setRunPart(args[runIndex]);
        removeItemAtIndex(args, runIndex)
      }
      break;
    default:
      console.log(`${red('*************************************')}`);
      console.log(`${red('**                                 **')}`);
      console.log(`${red('**        FLAG NO PERMITIDO        **')}`);
      console.log(`${red('**                                 **')}`);
      console.log(`${red('*************************************')}`);
      process.exit(2);
  }
});
