import { app, BrowserWindow, screen, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigI } from './src/app/core/interface/config-interface';

const { exec } = require('child_process');

import Functions from './electron/functions';
import HandlerConfigFile from './electron/handler-config-file';

import SharedElectronAngular, {
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
  ELECTRON_CLOSE_CONFIRMATION,
  ELECTRON_SHOW_CLOSE_CONFIRMATION,
  MessageTaskInterface,
  ELECTRON_EXPORT_CSV,
  ELECTRON_FOCUS_WINDOW,
  ELECTRON_OPEN_WEB_BROWSER,
  ELECTRON_EVENT_DOWNLOAD_UPDATE,
  ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE,
} from './electron/shared-electron-angular';
import AppUpdate from './electron/auto-update';
import ReplaceInFile from './electron/replace-in-file';
import DockerHandler from './electron/docker-handler';
import { operativeSystemE } from './src/app/core/typescript/constantes';
import ExportToExcel from './electron/export-to-excel';
import LogProcessor from './electron/write-logs';
import MachineId from './electron/machine-id';
import OpenBrowser from './electron/open-web-browser';
import { sharedState } from './electron/shared-state';
import PdfPrinter from './electron/pdf-printer';

let win: BrowserWindow | null;
let splash: BrowserWindow | null;
let auto_updater: AppUpdate;
let docker_handler: DockerHandler;
let replace_in_file: ReplaceInFile;
let pdf_printer: PdfPrinter;
let export_to_excel: ExportToExcel;

const Console: LogProcessor = LogProcessor.getInstance();
const openBrowser: OpenBrowser = OpenBrowser.getInstance();
const machineId: MachineId = MachineId.getInstance();

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

const appFilePath = `file://${path.join(app.getAppPath(), 'dist', 'browser', 'index.html')}`;
const iconPath = path.join(app.getAppPath(), serve ? 'src' : 'dist/browser', 'assets', 'icons', isMacOs() ? 'mac/icon.icns' : 'win/icon.ico');

function createSplash(type = 'splash') {
  if (splash) {
    splash.close();
    splash = null;
  }

  splash = new BrowserWindow({ width: 650, minWidth: 650, height: 500, minHeight: 500, transparent: true, frame: false, alwaysOnTop: true, icon: iconPath });

  const splashUrl = `file://${path.join(app.getAppPath(), serve ? 'src' : 'dist/browser', `${type}.html`)}`;

  writeLogs(' ----- CREATE SPLASH ------');

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
        icon: iconPath,
        webPreferences: { nodeIntegration: true, allowRunningInsecureContent: serve ? true : false, contextIsolation: false },
      });

      if (serve) {
        const port = $$PORT_APP$$;
        win.loadURL(`http://localhost:${port}`).catch(err => closeAppAndSplashError('Failed to load URL: ' + err));

        setTimeout(() => {
          win?.webContents.openDevTools();
        }, 250);
      } else {
        win.loadURL(appFilePath).catch(err => closeAppAndSplashError('Failed to load URL: ' + err));
      }

      win.maximize();
      win.setMenuBarVisibility(false);

      // Evento cuando ya se ha destruido la ventana
      win.on('closed', () => (win = null));

      // Evento cuando se intenta cerrar la ventana con el boton de cerrar
      win.on('close', (event: any) => {
        if (!sharedState.isUpdaterClosing) {
          event.preventDefault();
          sendCloseConfirmation();
        } else {
          closeApp();
        }
      });

      resolve(win);
    } catch (error) {
      console.error('CREATEW WINDOW error ', error);
      writeLogs(error, 'ERROR EJECUTANDO LA CARPETA PRINCIPAL');
      closeAppAndSplashError('ERROR EJECUTANDO LA CARPETA PRINCIPAL: ' + error);
    }
  });
}

try {
  app.on('ready', () => {
    // -------- borrar el archivo de logs --------
    Console.clean().then(async () => {
      createSplash();
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => closeApp());
} catch (e) {
  // Catch Error
  throw e;
}

// Función para mostrar y restaurar la ventana
function showWindow() {
  return new Promise<void>((resolve, reject) => {
    writeLogs(' ----- SHOW WINDOW -----');
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
    }
    resolve();
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Send close confirmation
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= -=-=-=-=-=-=-=-=-=-=-=-=-=-
export function sendCloseConfirmation() {
  writeLogs(' ----- SEND CLOSE CONFIRMATION -----');
  showWindow();
  SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_SHOW_CLOSE_CONFIRMATION, data: {} });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Close the app AND SPLASH ERROR
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function closeAppAndSplashError(error: string) {
  createSplash(`splash_error_desconocido`);
  closeApp();
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Close the app
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function closeApp() {
  if (win) {
    win.destroy();
    app.quit();

    writeLogs('###### CIERRE DE LA APLICACION ######');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// IS MACOS SYSTEM
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function isMacOs() {
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
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// continuar la carga de archivos necesarios
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function continuarCargandoArchivos(resolve) {
  // -------------- remplazar en archivos ----------------
  replace_in_file = new ReplaceInFile();
  export_to_excel = new ExportToExcel(app);
  pdf_printer = PdfPrinter.getInstance(win);

  writeLogs(' -------- CARGA DE ARCHIVOS NECESARIOS FINALIZADA --------');

  setTimeout(() => resolve(true), 2000);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function beforeCreateWindow(win) {
  // ----- Manejar las actualizaciones -----
  const serve_ = await getServer_();
  auto_updater = new AppUpdate(win, serve_);
  auto_updater.init();
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
      case ELECTRON_EVENT_DOWNLOAD_UPDATE:
        writeLogs('Descargando actualización');
        auto_updater.downloadUpdate();
        break;
      //
      case ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE:
        writeLogs('Verificando actualizaciones');
        auto_updater
          .verificateUpdateAvailable()
          .then(res => {
            task.response = res;
            console.log('task', task);
            console.log('res', res);

            event.reply(ELECTRON_RESPONSE, task);
          })
          .catch(err => {
            task.error = true;
            task.response = err;
            event.reply(ELECTRON_RESPONSE, task);
          });
        break;
      //
      case ELECTRON_RELOAD:
        writeLogs('RECARGANDO ELECTRON');
        win?.reload();
        if (!serve) win?.loadURL(appFilePath);
        break;
      //
      case ELECTRON_OPEN_WEB_BROWSER:
        openBrowser.open(parameters.url);
        break;
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
        writeLogs('INICIANDO PROCESO DE IMPRESION');

        const { base64, file: fileName, printer, type = 'reporte', pageOrientation = 'portrait' } = parameters;

        pdf_printer
          .generatePdfFileFromBase64({ fileName, base64, type, pageOrientation, printer })
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
      case ELECTRON_CLOSE_CONFIRMATION:
        writeLogs(' ----- CLOSE CONFIRMATION -----');
        closeApp();
        break;
      //
      case ELECTRON_FOCUS_WINDOW:
        writeLogs(' ----- FOCUS WINDOW -----');
        showWindow().then(() => {
          task.data = 'FOCUS LISTO';
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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ARCHIVO APP.CONFIG
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function parseAppConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      const serve_ = await getServer_();
      const pjson = require('./package.json');
      const config: ConfigI = await Functions.getConfigFile();

      const printer_list = await pdf_printer.getPrinters();
      config['operative_system'] = isMacOs() ? operativeSystemE.macOs : operativeSystemE.windows;
      config['is_development'] = serve_;
      config['gitUser'] = await getActualGitUser();
      config['machineId'] = machineId.value;
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
  if (win || splash) {
    Console.log(msg, titulo);
  }
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
