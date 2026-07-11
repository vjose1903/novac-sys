import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigI } from './src/app/core/interface/config-interface';

const { exec } = require('child_process');

import Functions from './electron/functions';
import HandlerConfigFile from './electron/handler-config-file';
import FirebaseConfigHandler from './electron/firebase-config-handler';
import SplashHandler, { ErrorType, TypedError } from './electron/splash-handler';

import {
  DESKTOP_COMMAND_CONFIRM_CLOSE,
  DESKTOP_COMMAND_EXPORT_CSV,
  DESKTOP_COMMAND_FOCUS_WINDOW,
  DESKTOP_COMMAND_GET_APP_CONFIG,
  DESKTOP_COMMAND_OPEN_EXTERNAL,
  DESKTOP_COMMAND_PRINT_BASE64,
  DESKTOP_COMMAND_RELOAD_APP,
  DESKTOP_COMMAND_SET_APP_CONFIG,
  DESKTOP_COMMAND_UPDATE_CHECK,
  DESKTOP_COMMAND_UPDATE_DOWNLOAD,
  DESKTOP_COMMAND_UPDATE_GET_STATE,
  DESKTOP_EVENT_APP_CLOSE_REQUESTED,
  DESKTOP_INVOKE_CHANNEL,
  DesktopInvokeRequest,
  sendDesktopEvent,
} from './electron/shared-electron-angular';

import AppUpdate from './electron/auto-update';
import DockerHandler from './electron/docker-handler';
import { operativeSystemE } from './src/app/core/typescript/constantes';
import ExportToExcel from './electron/export-to-excel';
import LogProcessor from './electron/write-logs';
import MachineId from './electron/machine-id';
import OpenBrowser from './electron/open-web-browser';
import { sharedState } from './electron/shared-state';
import PdfPrinter from './electron/pdf-printer';

let win: BrowserWindow | null;
let auto_updater: AppUpdate;
let docker_handler: DockerHandler;
let pdf_printer: PdfPrinter;
let export_to_excel: ExportToExcel;

const Console: LogProcessor = LogProcessor.getInstance();
const openBrowser: OpenBrowser = OpenBrowser.getInstance();

// Variables para las instancias inicializadas
let machineId: MachineId;
let handlerConfigFile: HandlerConfigFile;
let firebaseConfigHandler: FirebaseConfigHandler;
let splash_handler: SplashHandler;

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

const appFilePath = `file://${path.join(app.getAppPath(), 'dist', 'browser', 'index.html')}`;
const iconPath = path.join(app.getAppPath(), serve ? 'src' : 'dist/browser', 'assets', 'icons', isMacOs() ? 'mac/icon.icns' : 'win/icon.ico');
const preloadPath = path.join(__dirname, 'electron', 'preload.js');
const mainRuntimeConfigPath = path.join(__dirname, 'electron', 'main-runtime-config.json');

function getServePort() {
  try {
    if (fs.existsSync(mainRuntimeConfigPath)) {
      const configData = fs.readFileSync(mainRuntimeConfigPath, 'utf-8');
      const config = JSON.parse(configData);

      if (typeof config?.port === 'number' && Number.isFinite(config.port)) {
        return config.port;
      }
    }
  } catch (error) {
    writeLogs(error, 'ERROR leyendo main-runtime-config.json');
  }

  return 5220;
}

function createInitialSplash() {
  // Iniciar splash de carga y manejar el flujo
  splash_handler
    .createSplash('splash')
    .then(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await beforeCreateSplash();

        splash_handler.closeSplash();
        const win = await createWindow();
        beforeCreateWindow(win);
      } catch (error) {
        writeLogs(error, 'ERROR en beforeCreateSplash');
        splash_handler.createErrorSplash(error);
      }
    })
    .catch(error => {
      splash_handler.createErrorSplash(error);
    });
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
        webPreferences: {
          preload: preloadPath,
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      if (serve) {
        const port = getServePort();
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
        writeLogs(`Evento close disparado. closingReason: ${sharedState.closingReason}`, 'close-event');
        if (sharedState.closingReason !== 'none') return;

        writeLogs('Preparando confirmación de cierre...', 'close-event');
        event.preventDefault();
        sendCloseConfirmation();
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
      // Inicializar SplashHandler
      splash_handler = SplashHandler.getInstance(serve, iconPath);
      auto_updater = new AppUpdate(app, serve);
      auto_updater.init();
      createInitialSplash();
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    writeLogs(`Evento window-all-closed disparado. closingReason: ${sharedState.closingReason}`, 'window-all-closed');
    if (sharedState.closingReason === 'none') {
      writeLogs('Cerrando aplicación normalmente...', 'window-all-closed');
      closeApp();
    } else {
      writeLogs('Todas las ventanas cerradas durante actualización, permitiendo cierre automático...', 'window-all-closed');
    }
  });
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
  sendDesktopEvent(win, {
    eventName: DESKTOP_EVENT_APP_CLOSE_REQUESTED,
    payload: { reason: 'user-request' },
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Close the app AND SPLASH ERROR
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function closeAppAndSplashError(error: string, type: string = 'splash_error_desconocido') {
  writeLogs(error, 'closeAppAndSplashError');
  if (splash_handler) splash_handler.createSplash(type);

  closeApp();
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Close the app
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
export function closeApp() {
  if (sharedState.closingReason === 'none') {
    sharedState.closingReason = 'user-confirmed';
  }

  if (win) {
    win.destroy();
  }

  app.quit();
  writeLogs('###### CIERRE DE LA APLICACION ######');
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
async function beforeCreateSplash(): Promise<void> {
  writeLogs(' -------- INICIANDO CARGA DE ARCHIVOS NECESARIOS --------');

  try {
    // Inicializar componentes base
    await initializeBaseComponents();

    // Verificar y manejar configuración
    const configExists = await handlerConfigFile.configFileExists();

    if (configExists) {
      await handleExistingConfig();
    } else {
      await handleNewConfig();
    }

    // Solo continuar con la carga de archivos si todo salió bien
    continuarCargandoArchivos();
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // Usar splash_handler para manejar el error
    splash_handler.createErrorSplash(error);

    throw error; // Re-lanzar la excepción para que sea capturada por el SplashHandler
  }
}

// Función auxiliar para inicializar componentes base
async function initializeBaseComponents(): Promise<void> {
  machineId = await MachineId.getInstance();
  handlerConfigFile = await HandlerConfigFile.getInstance(machineId);
}

// Función auxiliar para manejar configuración existente
async function handleExistingConfig(): Promise<void> {
  const config = await Functions.getConfigFile();
  writeLogs(config.is_db_local, 'config.is_db_local');

  if (config.is_db_local) {
    const dbResult = await handleLocalDatabase();
    if (!dbResult) throw splash_handler.createTypedError('Error en configuración existente', ErrorType.CONFIG_FILE);
  }
}

// Función auxiliar para manejar base de datos local
async function handleLocalDatabase(): Promise<boolean> {
  docker_handler = DockerHandler.getInstance();

  try {
    await docker_handler.checkAllInDocker();
    return true;
  } catch (error_type) {
    writeLogs(error_type, 'ERROR al verificar la base de datos local');
    throw splash_handler.createTypedError(`Error al verificar la base de datos local: ${error_type}`, ErrorType.DATABASE_LOCAL, error_type);
  }
}

// Función auxiliar para manejar nueva configuración
async function handleNewConfig(): Promise<void> {
  try {
    firebaseConfigHandler = await FirebaseConfigHandler.getInstance(machineId);

    try {
      const firebaseConfig = await firebaseConfigHandler.getAppConfig();

      await Functions.setConfigFile(JSON.stringify(firebaseConfig));
      writeLogs('Guardando configuración en el archivo local');
    } catch (firebaseError) {
      writeLogs(firebaseError, 'ERROR al obtener configuración desde Firebase, usando configuración local');
      throw splash_handler.createTypedError('Error al obtener configuración desde Firebase', ErrorType.FIREBASE_CONFIG, firebaseError);
    }
  } catch (error) {
    throw error;
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// continuar la carga de archivos necesarios
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function continuarCargandoArchivos() {
  // -------------- remplazar en archivos ----------------
  export_to_excel = new ExportToExcel(app);

  writeLogs(' -------- CARGA DE ARCHIVOS NECESARIOS FINALIZADA --------');
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Handle angular events
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function beforeCreateWindow(win) {
  pdf_printer = PdfPrinter.getInstance(win);
  auto_updater.attachWindow(win);

  // Desmontar Firebase Config Handler ya que Angular está listo
  if (firebaseConfigHandler && firebaseConfigHandler.isReady()) {
    try {
      await firebaseConfigHandler.dispose();
    } catch (error) {
      writeLogs(error, 'ERROR al desmontar Firebase Config Handler');
    }
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Desktop commands
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
ipcMain.handle(DESKTOP_INVOKE_CHANNEL, handleDesktopCommand);

async function handleDesktopCommand(_event: Electron.IpcMainInvokeEvent, request: DesktopInvokeRequest) {
  try {
    const command = request?.command;
    const payload = request?.payload;

    writeLogs(request, 'Nuevo comando desktop');

    switch (command) {
      case DESKTOP_COMMAND_RELOAD_APP:
        writeLogs('RECARGANDO ELECTRON');
        win?.reload();
        if (!serve) win?.loadURL(appFilePath);
        return;
      case DESKTOP_COMMAND_OPEN_EXTERNAL:
        openBrowser.open((payload as { url: string }).url);
        return { ok: true };
      case DESKTOP_COMMAND_PRINT_BASE64: {
        writeLogs('INICIANDO PROCESO DE IMPRESION');

        const { base64, file: fileName, printer, type = 'reporte', pageOrientation = 'portrait' } = payload as {
          base64: string;
          file: string;
          printer: string;
          type?: string;
          pageOrientation?: string;
        };
        return await pdf_printer.generatePdfFileFromBase64({ fileName, base64, type, pageOrientation, printer });
      }
      case DESKTOP_COMMAND_EXPORT_CSV:
        writeLogs('INICIANDOO PROCESO DE EXPORTACION');
        return await export_to_excel.generateCSV(payload as { fileName: string; excelData: Array<string[]>; configuration: any });
      case DESKTOP_COMMAND_GET_APP_CONFIG:
        return await getAppConfig();
      case DESKTOP_COMMAND_SET_APP_CONFIG:
        await Functions.setConfigFile(JSON.stringify(payload));
        return 'LISTO';
      case DESKTOP_COMMAND_CONFIRM_CLOSE:
        writeLogs(' ----- CLOSE CONFIRMATION -----');
        sharedState.closingReason = 'user-confirmed';
        closeApp();
        return { ok: true };
      case DESKTOP_COMMAND_FOCUS_WINDOW:
        writeLogs(' ----- FOCUS WINDOW -----');
        await showWindow();
        return { ok: true };
      case DESKTOP_COMMAND_UPDATE_CHECK:
        return await auto_updater.checkForUpdates(((payload as { source?: 'auto' | 'manual' } | undefined)?.source) || 'manual');
      case DESKTOP_COMMAND_UPDATE_DOWNLOAD:
        return await auto_updater.downloadUpdate();
      case DESKTOP_COMMAND_UPDATE_GET_STATE:
        return auto_updater.getState();
      default:
        throw new Error(`Comando desktop no soportado: ${command}`);
    }
  } catch (error) {
    console.error('HANDLE DESKTOP COMMAND error ', error);
    writeLogs(error, 'HANDLE DESKTOP COMMAND ERROR');
    throw error;
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// OBTENER EL ARCHIVO APP.CONFIG
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
async function getAppConfig(): Promise<ConfigI> {
  try {
    const config: ConfigI = await Functions.getConfigFile();

    const printer_list = await pdf_printer.getPrinters();

    const enrichedConfig = {
      ...config,
      operative_system: isMacOs() ? operativeSystemE.macOs : operativeSystemE.windows,
      printersList: ['Ninguna', ...printer_list],
      app_version: app.getVersion(),
    };

    return enrichedConfig;
  } catch (error) {
    // Determinar tipo de error para mostrar splash específico
    const errorContext = determineErrorContext(error);

    writeLogs(error, `getAppConfig ERROR - ${errorContext.type}`);
    closeAppAndSplashError(errorContext.message, errorContext.splashType);

    throw {
      err: error,
      msg: errorContext.message,
      type: errorContext.type,
    };
  }
}

// Función auxiliar para determinar el contexto del error
function determineErrorContext(error: any) {
  // Si el error viene del docker handler
  if (typeof error === 'string' && error.includes('db')) {
    return {
      type: 'database',
      message: 'Error al iniciar la base de datos local',
      splashType: `splash_${error}_error`,
    };
  }

  // Si el error viene del archivo de configuración
  if (error.message && error.message.includes('config')) {
    return {
      type: 'config',
      message: 'Error buscando el archivo de configuración',
      splashType: 'splash_config_error',
    };
  }

  // Error genérico
  return {
    type: 'general',
    message: 'Error general al cargar la configuración',
    splashType: 'splash_error_desconocido',
  };
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
  // Siempre escribir logs, no solo cuando win o splash existan
  Console.log(msg, titulo);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA CREAR LA RUTA CORRECTA EN CASO DE SER COMPILADA O NO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

export function parsePath(path_temp) {
  return isMacOs() ? path_temp : path_temp.split('/').join('\\');
}

export function pathAdd(addToPath = '', inAsar = false): Promise<string> {
  return new Promise<string>(async resolve => {
    const serve_ = await getServer_();

    let path_temp;
    if (serve_) {
      // En desarrollo, usar process.cwd()
      path_temp = process.cwd();
    } else {
      if (inAsar) {
        // En producción, usar app.getAppPath() que funciona correctamente con ASAR
        path_temp = app.getAppPath();
      } else {
        // Para directorios fuera del ASAR, usar la ruta del ejecutable y agregar /resources
        path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.getName().toLowerCase())) + app.getName() + '/resources';
      }
    }

    path_temp = path_temp + addToPath;
    resolve(parsePath(path_temp));
  });
}
