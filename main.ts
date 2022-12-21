import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import { ConfigI } from './src/app/core/typescript/config-interface';

const request = require('request');
const { exec } = require('child_process');

const express = require('express');

import Functions from './electron/functions.js';
import HandlerConfigFile from './electron/handler-config-file';

import {
  KEYWORD_ELECTRON_CHANGE_CONFIG_FILE,
  KEYWORD_ELECTRON_EVENT_DECRYPT,
  KEYWORD_ELECTRON_EVENT_ENCRYPT,
  KEYWORD_ELECTRON_GET_APP_CONFIG,
  KEYWORD_ELECTRON_PRINT_BASE64,
  KEYWORD_ELECTRON_QUIT_APP,
  KEYWORD_ELECTRON_RESPONSE,
  KEYWORD_ELECTRON_SENDER,
  KEYWORD_ELECTRON_SET_APP_CONFIG,
  KEYWORD_ELECTRON_TEST,
  MessageTaskInterface,
} from './electron/shared-electron-angular.js';
import AppUpdater from './electron/auto-update.js';
import ReplaceInFile from './electron/replace-in-file.js';
import DockerHandler from './electron/docker-handler';

let emptyWin: BrowserWindow;
let win: BrowserWindow;
let splash: BrowserWindow;
let auto_updater: AppUpdater;
let docker_handler: DockerHandler;
let replace_in_file: ReplaceInFile;

const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');

function createSplash(type = 'splash') {
  if (splash) {
    splash.close();
    splash = emptyWin;
  }

  splash = new BrowserWindow({ width: 650, minWidth: 650, height: 500, minHeight: 500, transparent: true, frame: false, alwaysOnTop: true });

  const splash_html = localFilePath(`${type}.html`);

  splash.loadURL(url.format({ pathname: path.join(__dirname, splash_html), protocol: 'file:', slashes: true }));
  splash.center();

  if (type == 'splash') {
    beforeCreateSplash(splash).then((res) => {
      splash.close();
      createWindow().then((win) => beforeCreateWindow(win));
    });
  } else {
    shell.beep();
    setTimeout(() => {
      splash.close();
      app.quit();
    }, 6000);
  }
}

function createWindow() {
  return new Promise<BrowserWindow>(async (resolve, reject) => {
    puts('  ');
    puts('  ');
    puts(' ::::: ========= PASANDO A CREAR LA VENTANA DEL SISTEMA ========= :::::');
    puts('  ');
    puts('  ');
    puts(app.getVersion(), 'app.getVersion()');
    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    win = new BrowserWindow({
      x: 0,
      y: 0,
      width: size.width,
      minWidth: size.width,
      height: size.height,
      minHeight: size.height,
      icon: isMacOs() ? __dirname + '/icons/mac/icon.icns' : __dirname + '/icons/win/icon.ico',
      webPreferences: { nodeIntegration: true, allowRunningInsecureContent: serve ? true : false, contextIsolation: false },
    });

    if (serve) {
      win.webContents.openDevTools();
      require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`),
      });

      win.loadURL('http://localhost:5222');
    } else {
      win.loadURL(url.format({ pathname: path.join(__dirname, 'dist/index.html'), protocol: 'file:', slashes: true }));
    }

    win.setMenuBarVisibility(false);

    // if (serve) {
    //   win.webContents.openDevTools();

    //   require('electron-reload')(__dirname, {
    //     electron: require(path.join(__dirname, '/node_modules/electron')),
    //   });

    //   win.loadURL('http://localhost:5222');
    // } else {
    //   // Path when running electron executable
    //   let pathIndex = pathAdd('/dist/index.html');
    //   let baseDirectory = pathAdd('/dist/');

    //   // if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
    //   //   // Path when running electron in local folder
    //   //   pathIndex = '../dist/index.html';
    //   //   baseDirectory = '../dist';
    //   // }
    //   var httpPort = 5222;
    //   const app = express();

    //   app.use(express.static(path.resolve(baseDirectory)));

    //   app.get('/', (req, res) => {
    //     res.sendFile(path.resolve(pathIndex), { redirect: false, maxage: '1d', etag: false });
    //   });

    //   app.get('*', (req, res) => {
    //     res.sendFile(path.resolve(pathIndex), { redirect: false, maxage: '1d', etag: false });
    //   });

    //   // if (fs.existsSync('resources/app/index.html')) {
    //   //   // Path when running electron in local folder
    //   //   pathIndex = 'resources/app/index.html';
    //   //   baseDirectory = 'resources/app';
    //   // } else {
    //   //   app.use(express.static(path.join(__dirname, baseDirectory)));

    //   //   app.get('/', (req, res) => {
    //   //     res.sendFile(path.join(__dirname, pathIndex), { redirect: false, maxage: '1d', etag: false });
    //   //   });

    //   //   app.get('*', (req, res) => {
    //   //     res.sendFile(path.join(__dirname, pathIndex), { redirect: false, maxage: '1d', etag: false });
    //   //   });
    //   // }

    //   app.listen(httpPort, () => win.loadURL('http://localhost:5222'));

    //   // win.loadURL(url.format({
    //   //   pathname: path.join(__dirname, pathIndex),
    //   //   protocol: 'file:',
    //   //   slashes: true
    //   // }));
    // }

    // Emitted when the window is closed.
    win.on('closed', (event) => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = emptyWin;
    });

    resolve(win);
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => createSplash());

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd +
    app.quit();
  });
} catch (e) {
  // Catch Error
  // throw e;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER LA CONFIGURACION DE LA APP
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function isMacOs() {
  return process.platform === 'darwin';
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER LA CONFIGURACION DE LA APP
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function getConfig(): Promise<ConfigI> {
  return new Promise<any>(async (resolve, reject) => {
    const confTemp = (await Functions.getConfigFile()) as any;
    const conf: ConfigI = JSON.parse(confTemp);
    resolve(conf);
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER SI EL PROYECTO SE ESTA CORRIENDO EN PRODUCCION O EN DESARROLLO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
async function getServer_(): Promise<boolean> {
  return new Promise<any>((resolve, reject) => {
    const args_ = process.argv.slice(1);
    const serve_ = args_.some((val) => val === '--serve');
    resolve(serve_);
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// CONFIGURACIONES DESPUES DE QUE SE CREA EL SPLASH SCREEN
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function beforeCreateSplash(splash) {
  return new Promise<any>(async (resolve, reject) => {
    // -------- borrar el archivo de logs --------
    borrarLogs().then(async () => {
      puts(' -------- INICIANDO CARGA DE ARCHIVOS NECESARIOS --------');

      // ----------- inicializando docker handler --------------
      docker_handler = new DockerHandler();

      HandlerConfigFile.checkConfigFile(splash)
        .then(async (is_config_ready) => {
          if (is_config_ready) {
            const conf = await getConfig();
            const serve_ = await getServer_();

            // ----------- correr base de datos local --------------
            puts(conf.is_db_local, 'conf.is_db_local ');

            if (conf.is_db_local) {
              docker_handler
                .checkAllInDocker()
                .then((res_db) => continuarCargandoArchivos(resolve))
                .catch((error_type) => createSplash(`splash_${error_type}_error`));
              //
            } else {
              continuarCargandoArchivos(resolve);
            }
          }
        })
        .catch((err) => {
          createSplash('splash_config_error');
        });
    });
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// continuar la carga de archivos necesarios
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function continuarCargandoArchivos(resolve) {
  // -------------- remplazar en archivos ----------------
  replace_in_file = new ReplaceInFile();
  puts(' -------- CARGA DE ARCHIVOS NECESARIOS FINALIZADA --------');
  setTimeout(() => resolve(true), 2000);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function beforeCreateWindow(win) {
  // ----- Manejar las actualizaciones -----

  setTimeout(() => {
    puts(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');
    auto_updater = new AppUpdater(win);
  }, 1000);
  // ---------------------------------------
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
ipcMain.on(KEYWORD_ELECTRON_SENDER, handleEvent);

async function handleEvent(event: Electron.IpcMainEvent, obj: string) {
  try {
    var arg = JSON.parse(obj) as MessageTaskInterface;

    let res;

    switch (arg.eventName) {
      case KEYWORD_ELECTRON_TEST:
        // test function
        break;
      //
      case KEYWORD_ELECTRON_CHANGE_CONFIG_FILE:
        const obj = JSON.parse(arg.data);

        replace_in_file
          .replaceFunction(obj)
          .then((res) => {
            arg.response = res;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          })
          .catch((err) => {
            arg.response = err;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          });

        break;
      //
      case KEYWORD_ELECTRON_EVENT_DECRYPT:
        res = Functions.desEncriptar(arg.data);
        arg.response = res;
        event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
        break;
      //
      case KEYWORD_ELECTRON_EVENT_ENCRYPT:
        res = Functions.encriptar(arg.data);
        arg.response = res;
        event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
        break;
      //
      case KEYWORD_ELECTRON_PRINT_BASE64:
        puts('INICIANDOO PROCESO DE IMPRESION');
        const oPdf = JSON.parse(arg.data);

        const base64 = oPdf.base64;
        const fileName = oPdf.file;
        const printer = oPdf.printer;
        const type = oPdf['type'] ? oPdf['type'] : 'reporte';
        const pageOrientation = oPdf['pageOrientation'] ? oPdf['pageOrientation'] : 'portrait';

        generatePdfFileFormBase64({ fileName, base64, type, pageOrientation, printer })
          .then((res) => {
            arg.response = res;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          })
          .catch((err) => {
            arg.response = err;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          });

        break;
      //
      case KEYWORD_ELECTRON_GET_APP_CONFIG:
        getConfigFile()
          .then((config) => {
            arg.response = config;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          })
          .catch((err) => {
            arg.response = err;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          });
        break;
      //
      case KEYWORD_ELECTRON_SET_APP_CONFIG:
        Functions.setConfigFile(arg.data).then(() => {
          arg.response = 'LISTO';
          event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
        });
        break;
      //
      default:
        event.reply(KEYWORD_ELECTRON_RESPONSE);
        break;
    }
  } catch (error) {}
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ACTUAL USUARIO DE GIT
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function getActualGitUser() {
  return new Promise<any>(async (resolve, reject) => {
    const serve_ = await getServer_();

    if (serve_) {
      cmd(`git config --get user.name`, async (res_username) => {
        const username = res_username.STDOUT.trim() != '' ? res_username.STDOUT.trim() : 'vjose1903';
        resolve(username);
      });
    } else {
      resolve('vjose1903');
    }
  });
}

function getPrinters() {
  const printers_list = win.webContents.getPrinters().map((item) => item.name);

  return printers_list;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ARCHIVO APP.CONFIG
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function getConfigFile() {
  return new Promise(async (resolve, reject) => {
    const serve_ = await getServer_();
    const pjson = require('./package.json');

    Functions.getConfigFile()
      .then(async (config: any) => {
        var config = JSON.parse(config);
        const printer_list = getPrinters();
        config['is_development'] = serve_;
        config['gitUser'] = await getActualGitUser();
        config['printersList'] = ['Ninguna', ...printer_list];
        config['app_version'] = pjson.version;

        resolve(config);
      })
      .catch((err) => reject({ err: err, msg: 'Error buscando el archivo de configuracion' }));
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// BORRA EL ARCHIVO DE LOGS
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function borrarLogs() {
  return new Promise<any>(async (resolve, reject) => {
    const carpeta = await pathAdd('/log');

    if (!fs.existsSync(carpeta)) {
      fs.mkdir(carpeta, { recursive: true }, (err) => {
        if (err) throw err;
      });
    } else {
      const comando = isMacOs() ? `rm -rf "${await pathAdd('/log/my_log.txt')}"` : `del "${await pathAdd('/log/my_log.txt')}"`;

      cmd(comando);
    }

    setTimeout(() => resolve(true), 1000);
  });
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION PARA EJECUTAR COMANDOS DE CONSOLA
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function cmd(command, callback = (arg) => {}) {
  puts(command, 'comando realizado en la funcion cmd');

  exec(command, (error, stdout, stderr) => {
    let obj;
    if (error) {
      obj = { status: false, STDOUT: stdout, STDERR: stderr, msg: error };

      callback(obj);
    } else {
      obj = { status: true, msg: 'Comando realizado correctamente', STDOUT: stdout, STDERR: stderr };
      callback(obj);
    }
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION QUE SE ENCARGA DE VERIFICAR SI EL ARCHIVO LOG EXISTE
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export async function puts(msg, titulo?) {
  // cmd('ls');
  if (win || splash) {
    const fs = require('fs');

    const carpeta = await pathAdd('/log');
    const file = await pathAdd('/log/my_log.txt');

    let texto = '';
    if (typeof msg === 'object') texto = JSON.stringify(msg, null, '\t');
    else if (typeof msg === 'number') texto = msg.toString();
    else texto = msg;

    if (!fs.existsSync(carpeta)) {
      fs.mkdir(carpeta, { recursive: true }, (err) => {
        if (err) throw err;
        else escribirLogs(file, titulo, texto);
      });
    } else {
      escribirLogs(file, titulo, texto);
    }
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION QUE SE ENCARGA DE ESCRIBIR EN EL ARCHIVO LOG
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
async function escribirLogs(file, titulo, texto) {
  if (!fs.existsSync(file)) {
    const stream = fs.createWriteStream(file);

    await stream.once('open', (fd) => {
      stream.write(titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`);
      stream.end();
    });
  } else {
    await fs.appendFile(file, titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`, (err) => {});
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// GENERAR EL PDF
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function generatePdfFileFormBase64(params: { fileName: string; base64: string; type: string; pageOrientation: string; printer: string }) {
  return new Promise(async (resolve, reject) => {
    const pdfFileName = await pathAdd('/' + params.fileName);

    try {
      fs.writeFile(pdfFileName, params.base64, { encoding: 'base64' }, (err) => {
        imprimir({ fileName: params.fileName, tipo: params.type, pageOrientation: params.pageOrientation, printer: params.printer })
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    } catch (err) {
      reject({ msg: 'Error generando reporte!!', status: false, error: err });
    }
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// IMPRIMIR EL PDF
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function imprimir(params: { fileName: string; tipo: string; pageOrientation: string; printer: string }) {
  return new Promise(async (resolve, reject) => {

    const gsprint_path = await pathAdd(`/print/gsprint.exe`);
    const ghostscript_path = await pathAdd(`/print/gswin64c.exe`);

    const file_path = await pathAdd(`/${params.fileName}`);

    puts(`VOY A IMPRIMIR EL ARCHIVO ---> ${file_path}`);
    const comando = `${gsprint_path} -${params.pageOrientation} -ghostscript "${ghostscript_path}" -printer "${params.printer}" "${file_path}"`;

    cmd(comando, (res) => {
      if (res.status) resolve({ msg: 'PDF impreso correctamente!!', status: 'si', STDOUT: res });
      else reject({ msg: 'Error imprimiento PDF!!', status: 'no', err: res });
    });
  });
}

function localFilePath(path) {
  const local_path = serve ? `src/${path}` : `dist/${path}`;
  return local_path;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA CREAR LA RUTA CORRECTA EN CASO DE SER COMPILADA O NO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export function contruirPath(path_temp) {
  return isMacOs() ? path_temp : path_temp.split('/').join('\\');
}

export function pathAdd(addToPath = '', resource = true): Promise<string> {
  return new Promise<any>(async (resolve, reject) => {
    let path_temp;
    let path_resolved;
    const pjson = require('./package.json');
    const serve_ = await getServer_();

    if (serve_) {
      path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(pjson.name.toLowerCase())) + pjson.name;
    } else {
      if (resource) {
        path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources';
      } else {
        path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;
      }
    }

    path_temp = path_temp + addToPath;
    path_resolved = isMacOs() ? path_temp : path_temp.split('/').join('\\');

    resolve(path_resolved);
  });
}
