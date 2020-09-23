import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
import * as moment from 'moment';
const pdfmake = require('pdfmake/src/printer');
import { logoADM } from './files';

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

ipcMain.on('print', (event: any, arg) => {
  makeFacturaVenta(arg);
});

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

function makeFacturaVenta(DD) {
  // console.log(DD);

  const type_font = process.platform === 'darwin' ? 'roboto/Roboto' : 'roboto\\Roboto';

  const inicioRuta = process.platform === 'darwin' ? 'fonts/' : 'fonts\\';

  const fontDescriptors = {
    Roboto: {
      normal: PathApp() + inicioRuta + type_font + '-Regular.ttf',
      bold: PathApp() + inicioRuta + type_font + '-Bold.ttf',
      italics: PathApp() + inicioRuta + type_font + '-Italic.ttf',
      bolditalics: PathApp() + inicioRuta + type_font + '-BoldItalic.ttf',
    },
  };

  const printer = new pdfmake(fontDescriptors);

  // win.webContents.send('printRes', { msg: 'prueba', doc: JSON.stringify(DD), datos: data });
  const cFileName = 'factura.pdf';
  try {
    const pdfDoc = printer.createPdfKitDocument(DD);
    pdfDoc.pipe(fs.createWriteStream(cFileName)).on('finish', () => {
      console.log('finizu');
      win.webContents.send('printRes', { msg: 'Factura creada correctamente', status: 'prueba', body: DD, mas: JSON.stringify(DD) });
      // imprimir(cFileName);
    });
    pdfDoc.end();
  } catch (err) {
    console.log('::::::::ERROR::::::::');

    win.webContents.send('printRes', { msg: 'Error creando factura!!', status: false, error: err });
  }
}

function imprimir(cFileName) {
  const { exec } = require('child_process');
  // "C:\Users\User\Desktop\factura.pdf" "EPSON LX-350 ESC/P"

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
}

function PathApp() {
  return app.getPath('exe').substr(0, app.getPath('exe').indexOf(app.getName() + '.exe'));
}
