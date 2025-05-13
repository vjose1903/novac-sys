var fs = require('fs');
var path = require('path');

const clientes = ['brendy', 'agrodemi', 'vasquez', 'demo'];

const tipo_selected = process.argv.slice(2)[0];
const nivel = process.argv.slice(2)[1];

const setup_ = {
  demo: {
    TITLE_APP: 'Novac System - DEMO',
    PORT_APP: '5223',
    DB_PORT: '9093',
    DOCKER_NAME: 'demo',
    NAME_UPDATE_REPO: 'novac-system-demo',
    CUSTOM_ACCESS: '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',
  },
  agrodemi: {
    TITLE_APP: 'Novac System - AGRODEMI',
    PORT_APP: '5220',
    DB_PORT: '9090',
    DOCKER_NAME: 'agrodemi',
    NAME_UPDATE_REPO: 'novac-system-agrodemi',
    CUSTOM_ACCESS: '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',
  },
  brendy: {
    TITLE_APP: 'Novac System - Panaderia Brendy',
    PORT_APP: '5221',
    DB_PORT: '9091',
    DOCKER_NAME: 'brendy',
    NAME_UPDATE_REPO: 'novac-system-brendy',
    CUSTOM_ACCESS: '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',
  },
  vasquez: {
    TITLE_APP: 'Novac System - D` Vásquez Services',
    PORT_APP: '5222',
    DB_PORT: '9092',
    DOCKER_NAME: 'vasquez',
    NAME_UPDATE_REPO: 'novac-system-vasquez',
    CUSTOM_ACCESS: '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',
  },
};

const files = [
  { tipo: 'move', file_name: 'handler-config-file', extension: 'ts', path: 'electron/handler-config-file.ts' },
  { tipo: 'move', file_name: 'logos', extension: 'json', path: 'logos.json' },

  { tipo: 'reemplazo', file_name: 'docker-handler.ts', path: 'electron/docker-handler.ts' },
  { tipo: 'reemplazo', file_name: 'auto-update.ts', path: 'electron/auto-update.ts' },
  { tipo: 'reemplazo', file_name: 'environment.ts', path: 'src/environments/environment.ts' },
  { tipo: 'reemplazo', file_name: 'environment.web.ts', path: 'src/environments/environment.web.ts' },
  { tipo: 'reemplazo', file_name: 'index.html', path: 'src/index.html' },
  { tipo: 'reemplazo', file_name: 'package.json', path: 'package.json' },
  { tipo: 'reemplazo', file_name: 'main.ts', path: 'main.ts' },
];

function makeSetup(tipo) {
  console.log('\n\n\n ');
  setup_[tipo].DOCKER_NAME += nivel == 'dev' ? '-dev' : '-prod';

  if (clientes.includes(tipo)) {
    console.log('------------------------------------');
    console.log(`             ${tipo_selected}`);
    console.log('------------------------------------');
    console.log('\n ');

    files.forEach((obj_file) => {
      if (obj_file.tipo == 'reemplazo') {
        console.log('-=-=-=-=-=-=- ' + 'ARCHIVO CON REEMPLAZO');
        remplace_files(tipo, obj_file);
      } else {
        console.log('-=-=-=-=-=-=- ' + 'ARCHIVO A MOVER');
        move_files(tipo, obj_file);
      }

      console.log('\n ');
    });

    fs.writeFileSync(pathAdd('../config_setup/actual_cliente.txt'), tipo, { encoding: 'utf-8' });
  } else {
    console.log('********************************************');
    console.log('**                                        **');
    console.log('**          CLIENTE NO EXISTE             **');
    console.log('**                                        **');
    console.log('********************************************');
    return 0;
  }
}

// //  ============= REEMPLAZO =============
function remplace_files(tipo, obj_file) {
  let file_data = fs.readFileSync(pathAdd(`../config_setup/${obj_file.file_name}`), 'utf-8');

  Object.keys(setup_[tipo]).forEach((key) => {
    file_data = file_data.replaceAll(`$$${key}$$`, setup_[tipo][key]);
  });

  fs.writeFileSync(pathAdd(`../${obj_file.path}`), file_data, { encoding: 'utf-8' });

  console.log(`ARCHIVO: ${obj_file.file_name} reemplado.`);
}

// //  ============= MOVER =============
function move_files(tipo, obj_file) {
  let file_data = fs.readFileSync(pathAdd(`../config_setup/${obj_file.file_name}_${tipo}.${obj_file.extension}`), 'utf-8');

  fs.writeFileSync(pathAdd(`../${obj_file.path}`), file_data, { encoding: 'utf-8' });
  console.log('\n ');
  console.log(`ARCHIVO: ${obj_file.file_name} movido.`);
}

// //  ============= PATHADD =============
function pathAdd(str_path) {
  const path_resolved = path.join(__dirname, str_path);
  return path_resolved;
}

makeSetup(tipo_selected);
