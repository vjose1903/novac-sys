const fs = require('fs');
const path = require('path');

const clientes = ['brendy', 'agrodemi', 'vasquez', 'demo'];
const [cliente_selected, nivel] = process.argv.slice(2);

const CUSTOM_ACCESS = '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';

const setup_ = {
  demo: {
    TITLE_APP: 'Novac System - DEMO',
    PORT_APP: '5223',
    DB_PORT: '9093',
    CUSTOMER_NAME: 'demo',
    DOCKER_NAME: 'demo',
    NAME_UPDATE_REPO: 'novac-system-demo',
    CUSTOM_ACCESS: CUSTOM_ACCESS,
    DGII_DATE: '',
  },
  agrodemi: {
    TITLE_APP: 'Novac System - AGRODEMI',
    PORT_APP: '5220',
    DB_PORT: '9090',
    CUSTOMER_NAME: 'agrodemi',
    DOCKER_NAME: 'agrodemi',
    NAME_UPDATE_REPO: 'novac-system-agrodemi',
    CUSTOM_ACCESS: CUSTOM_ACCESS,
    DGII_DATE: '2025-05-15',
  },
  brendy: {
    TITLE_APP: 'Novac System - Panaderia Brendy',
    PORT_APP: '5221',
    DB_PORT: '9091',
    CUSTOMER_NAME: 'brendy',
    DOCKER_NAME: 'brendy',
    NAME_UPDATE_REPO: 'novac-system-brendy',
    CUSTOM_ACCESS: CUSTOM_ACCESS,
    DGII_DATE: '',
  },
  vasquez: {
    TITLE_APP: 'Novac System - D` Vásquez Services',
    PORT_APP: '5222',
    DB_PORT: '9092',
    CUSTOMER_NAME: 'vasquez',
    DOCKER_NAME: 'vasquez',
    NAME_UPDATE_REPO: 'novac-system-vasquez',
    CUSTOM_ACCESS: CUSTOM_ACCESS,
    DGII_DATE: '',
  },
};

const files = [
  { tipo: 'move', file_name: 'default_config/default_config', extension: 'json', path: 'electron/default_config.json' },
  { tipo: 'move', file_name: 'logos/logos', extension: 'json', path: 'logos.json' },

  { tipo: 'reemplazo', file_name: 'docker-handler.ts', path: 'electron/docker-handler.ts' },
  { tipo: 'reemplazo', file_name: 'main-runtime-config.json', path: 'electron/main-runtime-config.json' },
  { tipo: 'reemplazo', file_name: 'update-config.json', path: 'electron/update-config.json' },
  { tipo: 'reemplazo', file_name: 'environment/environment.ts', path: 'src/environments/environment.ts' },
  { tipo: 'reemplazo', file_name: 'environment/environment.dev.ts', path: 'src/environments/environment.dev.ts' },
  { tipo: 'reemplazo', file_name: 'environment/environment.prod.ts', path: 'src/environments/environment.prod.ts' },
  { tipo: 'reemplazo', file_name: 'index.html', path: 'src/index.html' },
  { tipo: 'reemplazo', file_name: 'package.json', path: 'package.json' },
  { tipo: 'reemplazo', file_name: 'deploy.yml', path: '.github/workflows/deploy.yml' }
];

// Función auxiliar para rutas
const pathAdd = str_path => path.join(__dirname, str_path);


// Función para reemplazar archivos
const reemplazarArchivo = (cliente, obj_file) => {
  let file_data = fs.readFileSync(pathAdd(`../config_setup/${obj_file.file_name}`), 'utf-8');
  
  Object.keys(setup_[cliente]).forEach(key => {
    file_data = file_data.replaceAll(`$$${key}$$`, setup_[cliente][key]);
  });
  
  fs.writeFileSync(pathAdd(`../${obj_file.path}`), file_data, { encoding: 'utf-8' });
  console.log(`ARCHIVO: ${obj_file.file_name} reemplazado.`);
};


// Función para mover archivos
const moverArchivo = (cliente, obj_file) => {
  const file_data = fs.readFileSync(
    pathAdd(`../config_setup/${obj_file.file_name}_${cliente}.${obj_file.extension}`), 
    'utf-8'
  );
  
  fs.writeFileSync(pathAdd(`../${obj_file.path}`), file_data, { encoding: 'utf-8' });
  console.log(`ARCHIVO: ${obj_file.file_name} movido.`);
};


// Configuración principal
function configuraCliente(cliente) {
  if (!clientes.includes(cliente)) {
    console.log('********************************************');
    console.log('**                                        **');
    console.log('**          CLIENTE NO EXISTE             **');
    console.log('**                                        **');
    console.log('********************************************');
    return false;
  }

  console.log('\n\n\n ');
  setup_[cliente].DOCKER_NAME += `-${nivel}`;
  
  console.log('------------------------------------');
  console.log(`             ${cliente}`);
  console.log('------------------------------------');
  console.log('\n ');

  files.forEach(obj_file => {
    if (obj_file.tipo === 'reemplazo') {
      console.log('-=-=-=-=-=-=- ARCHIVO CON REEMPLAZO');
      reemplazarArchivo(cliente, obj_file);
    } else {
      console.log('-=-=-=-=-=-=- ARCHIVO A MOVER');
      moverArchivo(cliente, obj_file);
    }
    console.log('\n ');
  });

  const actual_cliente = { name: cliente };

  fs.writeFileSync(pathAdd('../actual_cliente.json'), JSON.stringify(actual_cliente), { encoding: 'utf-8' });
  return true;
}

configuraCliente(cliente_selected);
