import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
const pdfmake = require('pdfmake/src/printer');
import * as facturasCompraVenta from './pdfs/facturasCompraVenta';
import * as recibosIngresos from './pdfs/recibosIngresos';
import * as conduces from './pdfs/conduce';
const electronInstaller = require('electron-winstaller');

// this should be placed at top of main.js to handle setup events quickly
// if (handleSquirrelEvent(app)) {
//   // squirrel event handled and app will exit in 1000ms, so don't do anything else
//   console.log('el diablo');
//   // return;
// }

// tslint:disable-next-line: one-variable-per-declaration
let win, serve;
const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');

let contents;

export let inicioRuta = __dirname;

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    icon: process.platform === 'darwin' ? __dirname + '/icons/mac/icon.icns' : __dirname + '/icons/win/icon.ico',
    width: size.width,
    height: size.height,
    minWidth: size.width,
    minHeight: size.height,
    webPreferences: {
      nodeIntegration: true,
      plugins: true,
    },
  });

  if (serve) {
    contents = win.webContents;
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  throw e;
}

ipcMain.on('printerNames', (event: any, arg) => {
  // name of function
  var printersName = win.webContents.getPrinters();
  event.sender.send('printersNameRes', printersName);
});

ipcMain.on('print', (event: any, oPdf) => {
  let obj;
  let todo_true = true;
  const data = oPdf.data;
  const type = oPdf.type;

  console.log('data', data);

  switch (type) {
    case 'recibo_ingreso':
      obj = recibosIngresos.makeRecibo(data);
      break;

    case 'conduce':
      obj = conduces.makeConduce(data);
      break;

    case 'facturacion':
      obj = facturasCompraVenta.makeFacturaVenta(data);
      break;

    default:
      todo_true = false;
      break;
  }
  if (todo_true) {
    const dd = obj.doc;
    const file = obj.file;
    makePdf(dd, file);
  } else {
    returnErrorPDF();
  }
});

function returnErrorPDF() {
  win.webContents.send('printRes', { msg: 'Error creando el pdf.', status: 'no' });
}

// ==========================================================================================================================================================
// ==========================================================================================================================================================
// SQUIRREL ELECTRON
// ==========================================================================================================================================================

function handleSquirrelEvent(application) {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = (command, args) => {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {
        detached: true,
      });
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      application.quit();
      return true;
  }
}

// ==========================================================================================================================================================
// MAKE PDF
// ==========================================================================================================================================================

function makePdf(dd, file) {
  const type_font = process.platform === 'darwin' ? 'roboto/Roboto' : 'roboto\\Roboto';
  const font_dir = process.platform === 'darwin' ? 'fonts/' : 'fonts\\';

  const path = process.platform === 'darwin' ? PathApp() : PathApp().replace('/', '\\');

  const fontDescriptors = {
    Roboto: {
      normal: path + font_dir + type_font + '-Regular.ttf',
      bold: path + font_dir + type_font + '-Bold.ttf',
      italics: path + font_dir + type_font + '-Italic.ttf',
      bolditalics: path + font_dir + type_font + '-BoldItalic.ttf',
    },
  };
  const printer = new pdfmake(fontDescriptors);

  // win.webContents.send('printRes', { msg: 'prueba', doc: JSON.stringify(dd), datos: data });
  const cFileName = file;
  try {
    const pdfDoc = printer.createPdfKitDocument(dd);
    pdfDoc.pipe(fs.createWriteStream(cFileName)).on('finish', () => {
      console.log('finizu');
      win.webContents.send('printRes', { msg: 'Pruebas', status: 'si', body: dd, sbody: JSON.stringify(dd) });
      // imprimir(cFileName);
    });
    pdfDoc.end();
  } catch (err) {
    console.log('::::::::ERROR::::::::');
    console.log(err);

    win.webContents.send('printRes', { msg: 'Error creando factura!!', status: false, error: err });
  }
}

function imprimir(cFileName) {
  // var args = ['-print-to-default', '-print-settings "noscale,monochrome"', '-silent', cFileName];
  const { exec } = require('child_process');
  // "C:\Users\User\Desktop\factura.pdf" "EPSON LX-350 ESC/P"
  // exec(`${sumatrapdf_path} -print-to-default -print-settings "" ${cFileName}`, (error, stdout, stderr) => { });

  var foxitPath = PathApp() + 'print\\FoxitReaderPortable.exe';

  exec(`${foxitPath} /t "${PathApp()}factura.pdf"`, (error, stdout, stderr) => {
    if (error) {
      win.webContents.send('printRes', { msg: 'Error imprimiendo Factura!!', status: 'no', err: error });
      return;
    } else {
      console.log('stdout  ', stdout);
      console.log('stderr  ', stderr);
      win.webContents.send('printRes', { msg: 'Factura impresa correctamente!!', status: 'si' });
    }
  });
  // exec(`"C:\\Program Files\\Adobe\\Reader 10.0\\Reader\\AcroRd32.exe" /t "C:\\Users\\User\\Documents\\proyectos\\adm-agroindustrial\\test.pdf" "EPSON LX-350 ESC/P"`, (error, stdout, stderr) => { });
}
function PathApp() {
  if (process.platform === 'darwin') {
    return app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.getName().toLowerCase())) + app.getName() + '/';
  } else {
    return (
      app.getPath('exe').substr(
        0,
        app
          .getPath('exe')
          .toLowerCase()
          .indexOf(app.getName().toLowerCase() + '.exe'),
      ) +
      app.getName() +
      '/'
    );
  }
}
