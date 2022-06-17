var fs = require('fs');
var path = require('path');

const clientes = ['brendy', 'agrodemi'];

const tipo_selected = process.argv.slice(2)[0];
const nivel = process.argv.slice(2)[1];

const setup_ = {
  brendy: {
    PRODUCT_NAME: 'NOVAC - PANADERIA BRENDY',
    PRODUCT_DESCRIPTION: 'Sistema facturacion e inventario NOVAC, Para Panaderia Brendy',
    TITLE_APP: 'Novac System - Panaderia Brendy',
    PORT_APP: '5221',
    DB_PORT: '3001',
    DOCKER_NAME: 'brendy',
  },
  agrodemi: {
    PRODUCT_NAME: 'NOVAC - AGRODEMI',
    PRODUCT_DESCRIPTION: 'Sistema facturacion e inventario NOVAC, Para AGRODEMI',
    TITLE_APP: 'Novac System - AGRODEMI',
    PORT_APP: '5220',
    DB_PORT: '3000',
    DOCKER_NAME: 'agrodemi',
  },
};

const files = [
  { tipo: 'move', file_name: 'handler-config-file', extension: 'ts', path: 'electron/handler-config-file.ts' },
  { tipo: 'move', file_name: 'logos', extension: 'json', path: 'logos.json' },

  { tipo: 'reemplazo', file_name: 'docker-handler.ts', path: 'electron/docker-handler.ts' },
  { tipo: 'reemplazo', file_name: 'electron-builder.json', path: 'electron-builder.json' },
  { tipo: 'reemplazo', file_name: 'environment.ts', path: 'src/environments/environment.ts' },
  { tipo: 'reemplazo', file_name: 'environment.web.ts', path: 'src/environments/environment.web.ts' },
  { tipo: 'reemplazo', file_name: 'index.html', path: 'src/index.html' },
  { tipo: 'reemplazo', file_name: 'package.json', path: 'package.json' },
  { tipo: 'reemplazo', file_name: 'photos.service.ts', path: 'src/app/core/services/photos.service.ts' },
  { tipo: 'reemplazo', file_name: 'main.ts', path: 'main.ts' },
];

function makeSetup(tipo) {
  console.log(' ');
  console.log(' ');
  console.log(' ');
  setup_[tipo].DOCKER_NAME += nivel == 'dev' ? '-dev' : '-prod';

  if (clientes.includes(tipo)) {
    console.log('------------------------------------');
    console.log(`             ${tipo_selected}`);
    console.log('------------------------------------');
    console.log(' ');

    files.forEach((obj_file) => {
      if (obj_file.tipo == 'reemplazo') {
        console.log('-=-=-=-=-=-=- ' + 'ARCHIVO CON REEMPLAZO');
        remplace_files(tipo, obj_file);
      } else {
        console.log('-=-=-=-=-=-=- ' + 'ARCHIVO A MOVER');
        move_files(tipo, obj_file);
      }

      console.log(' ');
    });

    fs.writeFileSync('config_setup/actual_cliente.txt', tipo, { encoding: 'utf-8' });
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
  let file_data = fs.readFileSync(`config_setup/${obj_file.file_name}`, 'utf-8');

  Object.keys(setup_[tipo]).forEach((key) => {
    file_data = file_data.replaceAll(`$$${key}$$`, setup_[tipo][key]);
  });

  fs.writeFileSync(obj_file.path, file_data, { encoding: 'utf-8' });

  console.log(`ARCHIVO: ${obj_file.file_name} reemplado.`);
}

// //  ============= MOVER =============
function move_files(tipo, obj_file) {
  let file_data = fs.readFileSync(`config_setup/${obj_file.file_name}_${tipo}.${obj_file.extension}`, 'utf-8');

  fs.writeFileSync(obj_file.path, file_data, { encoding: 'utf-8' });
  console.log(' ');
  console.log(`ARCHIVO: ${obj_file.file_name} movido.`);
}

// //  ============= PATHADD =============
function pathAdd(str_path) {
  const path_resolved = path.join(__dirname, str_path);
  return path_resolved;
}

makeSetup(tipo_selected);
