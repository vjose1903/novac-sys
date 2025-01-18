import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import { ConfigI } from './src/app/core/interface/config-interface';

const { exec } = require('child_process');

import Functions from './electron/functions';
import HandlerConfigFile from './electron/handler-config-file';

import {
  ELECTRON_CHANGE_CONFIG_FILE,
  ELECTRON_EVENT_DECRYPT,
  ELECTRON_EVENT_ENCRYPT,
  ELECTRON_GET_APP_CONFIG,
  ELECTRON_PRINT_BASE64,
  ELECTRON_RESPONSE,
  ELECTRON_SENDER,
  ELECTRON_SET_APP_CONFIG,
  ELECTRON_TEST,
  ELECTRON_RELOAD,
  MessageTaskInterface,
  ELECTRON_EXPORT_CSV,
} from './electron/shared-electron-angular';
import AppUpdater from './electron/auto-update';
import ReplaceInFile from './electron/replace-in-file';
import DockerHandler from './electron/docker-handler';
import { operativeSystemE } from './src/app/core/typescript/constantes';
import ExportToExcel from './electron/exort-to-excel';

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let auto_updater: AppUpdater;
let export_to_excel: ExportToExcel;
let docker_handler: DockerHandler;
let replace_in_file: ReplaceInFile;

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
const appFilePath: any = url.format({ pathname: path.join(app.getAppPath(), 'dist', 'browser', 'index.html'), protocol: 'file:', slashes: true });

function createSplash(type = 'splash') {
  if (splash) {
    splash.close();
    splash = null;
  }

  splash = new BrowserWindow({ width: 650, minWidth: 650, height: 500, minHeight: 500, transparent: true, frame: false, alwaysOnTop: true });

  const splashUrl = url.format({ pathname: path.join(app.getAppPath(), serve ? 'src' : 'dist/browser', `${type}.html`), protocol: 'file:', slashes: true });

  splash.loadURL(splashUrl);
  splash.center();

  if (type == 'splash') {
    beforeCreateSplash(splash).then(res => {
      splash?.close();
      createWindow().then(win => beforeCreateWindow(win));
    });
  } else {
    shell.beep();
    setTimeout(() => {
      splash?.close();
      app.quit();
    }, 6000);
  }
}

function createWindow() {
  return new Promise<BrowserWindow>(async (resolve, reject) => {
    try {
      writeLogs('  ');
      writeLogs('  ');
      writeLogs(' ::::: ========= PASANDO A CREAR LA VENTANA DEL SISTEMA ========= :::::');
      writeLogs('  ');
      writeLogs('  ');
      writeLogs(app.getVersion(), 'app.getVersion()');

      const electronScreen = screen;

      const size = electronScreen.getPrimaryDisplay().workAreaSize;

      // Create the browser window.
      win = new BrowserWindow({
        width: size.width,
        minWidth: size.width,
        height: size.height,
        minHeight: size.height,
        icon: isMacOs() ? __dirname + '/icons/mac/icon.icns' : __dirname + '/icons/win/icon.ico',
        webPreferences: { nodeIntegration: true, allowRunningInsecureContent: serve ? true : false, contextIsolation: false },
      });

      if (serve) {
        win.loadURL('http://localhost:$$PORT_APP$$');
      } else {
        win.loadURL(appFilePath);
      }

      win.maximize();
      win.setMenuBarVisibility(false);

      setTimeout(() => {
        if (serve) win?.webContents.openDevTools();
      }, 250);

      // Emitted when the window is closed.
      win.on('closed', () => (win = null));

      resolve(win);
    } catch (error) {
      console.error('CREATEW WINDOW error ', error);
      writeLogs(error, 'ERROR EJECUTANDO LA CARPETA PRINCIPAL');
      console.error(error);
    }
  });
}

try {
  app.on('ready', () => createSplash());

  // Quit when all windows are closed.
  app.on('window-all-closed', () => app.quit());
} catch (e) {
  // Catch Error
  throw e;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// IS MACOS SYSTEM
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function isMacOs() {
  return process.platform === 'darwin';
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER SI EL PROYECTO SE ESTA CORRIENDO EN PRODUCCION O EN DESARROLLO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
async function getServer_(): Promise<boolean> {
  return new Promise<any>((resolve, reject) => {
    const args_ = process.argv.slice(1);
    const serve_ = args_.some(val => val === '--serve');
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
      writeLogs(' -------- INICIANDO CARGA DE ARCHIVOS NECESARIOS --------');

      // ----------- inicializando docker handler --------------
      docker_handler = new DockerHandler();

      HandlerConfigFile.checkConfigFile(splash)
        .then(async is_config_ready => {
          if (is_config_ready) {
            Functions.getConfigFile()
              .then(async config => {
                // ----------- correr base de datos local --------------
                writeLogs(config.is_db_local, 'config.is_db_local ');

                if (config.is_db_local) {
                  docker_handler
                    .checkAllInDocker()
                    .then(res_db => continuarCargandoArchivos(resolve))
                    .catch(error_type => createSplash(`splash_${error_type}_error`));
                  //
                } else {
                  continuarCargandoArchivos(resolve);
                }
              })
              .catch(err => {
                createSplash('splash_config_error');
              });
          }
        })
        .catch(err => {
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
  export_to_excel = new ExportToExcel(app);

  writeLogs(' -------- CARGA DE ARCHIVOS NECESARIOS FINALIZADA --------');

  setTimeout(() => resolve(true), 2000);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function beforeCreateWindow(win) {
  // ----- Manejar las actualizaciones -----
  const serve_ = await getServer_();
  auto_updater = new AppUpdater(win, serve_);

  // ---------------------------------------
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
ipcMain.on(ELECTRON_SENDER, handleEvent);

async function handleEvent(event: any, obj: string) {
  try {
    const task = JSON.parse(obj) as MessageTaskInterface;
    const parameters = task?.data ? JSON.parse(task.data) : task?.data;
    writeLogs(task, 'Nueva tarea recibida');

    let res;

    switch (task.eventName) {
      case ELECTRON_TEST:
        // test function
        break;
      //
      case ELECTRON_RELOAD:
        writeLogs('RECARGANDO ELECTRON');
        win?.reload();
        if (!serve) win?.loadURL(appFilePath);
        break;
      //
      case ELECTRON_CHANGE_CONFIG_FILE:
        replace_in_file
          .replaceFunction(parameters)
          .then(res => {
            task.response = res;
            event.reply(ELECTRON_RESPONSE, task);
          })
          .catch(err => {
            task.error = true;
            task.response = err;
            event.reply(ELECTRON_RESPONSE, task);
          });

        break;
      //
      case ELECTRON_EVENT_DECRYPT:
        res = Functions.desEncriptar(task.data);
        task.response = res.object;
        event.reply(ELECTRON_RESPONSE, task);
        break;
      //
      case ELECTRON_EVENT_ENCRYPT:
        res = Functions.encriptar(task.data);
        task.response = res;
        event.reply(ELECTRON_RESPONSE, task);
        break;
      //
      case ELECTRON_PRINT_BASE64:
        writeLogs('INICIANDOO PROCESO DE IMPRESION');

        const base64 = parameters.base64;
        const fileName = parameters.file;
        const printer = parameters.printer;
        const type = parameters['type'] ? parameters['type'] : 'reporte';
        const pageOrientation = parameters['pageOrientation'] ? parameters['pageOrientation'] : 'portrait';

        generatePdfFileFormBase64({ fileName, base64, type, pageOrientation, printer })
          .then(res => {
            task.response = res;
            event.reply(ELECTRON_RESPONSE, task);
          })
          .catch(err => {
            task.error = true;
            task.response = err;
            event.reply(ELECTRON_RESPONSE, task);
          });

        break;
      //
      case ELECTRON_EXPORT_CSV:
        writeLogs('INICIANDOO PROCESO DE EXPORTACION');

        export_to_excel
          .generateCSV(parameters)
          .then(res => {
            task.response = res;
            event.reply(ELECTRON_RESPONSE, task);
          })
          .catch(err => {
            task.error = true;
            task.response = err;
            event.reply(ELECTRON_RESPONSE, task);
          });

        break;
      //
      case ELECTRON_GET_APP_CONFIG:
        parseAppConfig()
          .then(config => {
            task.response = config;
            event.reply(ELECTRON_RESPONSE, task);
          })
          .catch(err => {
            task.error = true;
            task.response = err;
            event.reply(ELECTRON_RESPONSE, task);
          });
        break;
      //
      case ELECTRON_SET_APP_CONFIG:
        Functions.setConfigFile(task.data).then(() => {
          task.response = 'LISTO';
          event.reply(ELECTRON_RESPONSE, task);
        });
        break;
      //
      default:
        event.reply(ELECTRON_RESPONSE);
        break;
    }
  } catch (error) {
    console.error('HANDLE EVENTE error ', error);
    writeLogs(error, 'HANDLE EVENT ERROR ');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ACTUAL USUARIO DE GIT
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function getActualGitUser() {
  return new Promise<string>(async (resolve, reject) => {
    const serve_ = await getServer_();

    if (serve_) {
      runTerminalCommand(`git config --get user.name`)
        .then(res => {
          const username = res.STDOUT.trim() != '' ? res.STDOUT.trim() : 'vjose1903';
          resolve(username);
        })
        .catch(error => {
          console.error('getActualGitUser', error);
          reject(error);
        });
    } else {
      resolve('vjose1903');
    }
  });
}

async function getPrinters() {
  const printerPromise = await win?.webContents.getPrintersAsync();
  if (printerPromise) {
    const printers_list = printerPromise.map(item => item.name);
    return printers_list;
  } else {
    return [];
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ARCHIVO APP.CONFIG
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function parseAppConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      const serve_ = await getServer_();
      const pjson = require('./package.json');
      const config: ConfigI = await Functions.getConfigFile();

      const printer_list = await getPrinters();
      config['operative_system'] = isMacOs() ? operativeSystemE.macOs : operativeSystemE.windows;
      config['is_development'] = serve_;
      config['gitUser'] = await getActualGitUser();
      config['printersList'] = ['Ninguna', ...printer_list];
      config['app_version'] = pjson.version;

      resolve(config);
    } catch (error) {
      console.error('parseAppConfig', error);
      reject({ err: error, msg: 'Error buscando el archivo de configuracion' });
    }
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// BORRA EL ARCHIVO DE LOGS
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function borrarLogs() {
  return new Promise<boolean>(async resolve => {
    const carpeta = await pathAdd('/log');

    if (!fs.existsSync(carpeta)) {
      fs.mkdir(carpeta, { recursive: true }, err => {
        if (err) throw err;
      });
    } else {
      const comando = isMacOs() ? `rm -rf "${await pathAdd('/log/my_log.txt')}"` : `del "${await pathAdd('/log/my_log.txt')}"`;

      runTerminalCommand(comando);
    }

    setTimeout(() => resolve(true), 1000);
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION PARA EJECUTAR COMANDOS DE CONSOLA
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function runTerminalCommand(command) {
  return new Promise<{ msg: string; STDOUT: string; STDERR: string }>((resolve, reject) => {
    writeLogs(command, 'comando realizado en la funcion runTerminalCommand');

    exec(command, (error, stdout, stderr) => {
      if (Functions.isEmpty(error) && Functions.isEmpty(stderr)) {
        resolve({ msg: 'Comando realizado correctamente', STDOUT: stdout, STDERR: stderr });
      } else {
        reject({ STDOUT: stdout, STDERR: stderr, msg: error });
      }
    });
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION QUE SE ENCARGA DE VERIFICAR SI EL ARCHIVO LOG EXISTE
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export async function writeLogs(msg, titulo?) {
  // runTerminalCommand('ls');
  if (win || splash) {
    const fs = require('fs');

    const carpeta = await pathAdd('/log');
    const file = await pathAdd('/log/my_log.txt');

    let texto = '';
    if (typeof msg === 'object') texto = JSON.stringify(msg, null, '\t');
    else if (typeof msg === 'number') texto = msg.toString();
    else texto = msg;

    if (!fs.existsSync(carpeta)) {
      fs.mkdir(carpeta, { recursive: true }, err => {
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

    await stream.once('open', () => {
      stream.write(titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`);
      stream.end();
    });
  } else {
    await fs.appendFile(file, titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`, () => {});
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// GENERAR EL PDF
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function generatePdfFileFormBase64(params: { fileName: string; base64: string; type: string; pageOrientation: string; printer: string }) {
  return new Promise(async (resolve, reject) => {
    const pdfFileName = await pathAdd('/' + params.fileName);

    try {
      fs.writeFile(pdfFileName, params.base64, { encoding: 'base64' }, () => {
        imprimir({ fileName: params.fileName, tipo: params.type, pageOrientation: params.pageOrientation, printer: params.printer })
          .then(res => resolve(res))
          .catch(err => reject(err));
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
    const file_path = await pathAdd(`/${params.fileName}`);

    writeLogs(`VOY A IMPRIMIR EL ARCHIVO ---> ${file_path}`);
    let comando = '';

    if (isMacOs()) {
      // let pageSize = `${params.width}x${params.height}in`;
      // options.push(`-o PageSize=${pageSize}`);
      comando = `lp -o ${params.pageOrientation} -o ColorModel=RGB -o fit-to-page -d "${params.printer}" "${file_path}"`;
    } else {
      const gsprint_path = await pathAdd(`/print/gsprint.exe`);
      const ghostscript_path = await pathAdd(`/print/gswin64c.exe`);

      comando = `${gsprint_path} -${params.pageOrientation} -colour -ghostscript "${ghostscript_path}" -dPDFFitPage -printer "${params.printer}" "${file_path}"`;
    }

    runTerminalCommand(comando)
      .then(res => {
        resolve({ msg: 'PDF impreso correctamente!!', STDOUT: res });
      })
      .catch(err => reject({ msg: 'Error imprimiento PDF!!', err }));
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA CREAR LA RUTA CORRECTA EN CASO DE SER COMPILADA O NO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export function parsePath(path_temp) {
  return isMacOs() ? path_temp : path_temp.split('/').join('\\');
}

export function pathAdd(addToPath = '', resource = true): Promise<string> {
  return new Promise<string>(async resolve => {
    let path_temp;
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

    resolve(parsePath(path_temp));
  });
}
