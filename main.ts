import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
import * as moment from 'moment';
const autoUpdater = require('electron-updater').autoUpdater;
const pdfmake = require('pdfmake/src/printer');

const facturasCompraVenta = require(`${getFuncionalPath('/myPdf/facturasCompraVenta.js')}`);
const recibosIngresos = require(`${getFuncionalPath('/myPdf/recibosIngresos.js')}`);
const conduce = require(`${getFuncionalPath('/myPdf/conduce.js')}`);

// tslint:disable: curly
// tslint:disable: one-variable-per-declaration
let win, serve;
const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');

let contents;

export let inicioRuta = __dirname;

function createWindow() {
  // autoUpdater.checkForUpdates();
  autoUpdater.checkForUpdatesAndNotify();

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
  
  win.webContents.openDevTools();


  win.setMenuBarVisibility(false)

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
// ==========================================================================================================================================================
// AUTO UPDATE
// ==========================================================================================================================================================

autoUpdater.logger = require('electron-log');

autoUpdater.logger.transports.file.level = 'info';

autoUpdater.on('checking-for-update', () => {
  if (win) {
    win.webContents.send('checking-for-update', { msg: 'verificando actualizacion...' });
  }
  console.log('checking-for-update');
});

autoUpdater.on('update-available', (info) => {
  if (win) {
    win.webContents.send('update-available', { msg: 'ACTUALIZACION DISPONIBLE!!!', body: info });
  }
  const dialogOpts: any = {
    type: 'info',
    buttons: ['ok'],
    title: 'Actualización disponible',
    message: 'VjPOS presenta una nueva actualizacion se empezara a descargar ahora.',
    detail: `Version: ${info.version} Fecha de actualizacion: ${fecha(info.releaseDate)}`,
  };

});

autoUpdater.on('download-progress', (progress) => {
  if (win) {
    win.webContents.send('download-progress', { msg: 'descarga porciento...', body: progress });
  }
  console.log('download-progress', Math.floor(progress.percent));
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Reiniciar', 'Luego'],
    title: 'Actualizacion descargada',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'Para que las actualizaciones sean efectivas debe de reiniciar la aplicacion.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
    if (win) {
      win.webContents.send('update-downloaded', { msg: 'descarga finalizada...', body: returnValue });
    }
  });
  // autoUpdater.quitAndInstall();
});

autoUpdater.on('update-not-available', (info) => {
  console.log('update-not-available');
});

autoUpdater.on('error', (error) => {
  if (win) {
    win.webContents.send('update-error', { msg: 'error descargando actualizacion...', body: error });
  }
  console.error('error', error);
});

// ==========================================================================================================================================================
ipcMain.on('printerNames', (event: any, arg) => {
  // name of function
  const printersName = win.webContents.getPrinters();
});

ipcMain.on('getVersion', (event: any, arg) => {
  // name of function

  var pjson = require('./package.json');
  console.log('----> ', pjson.version);
  event.reply('versionResponse', pjson.version);
});

function puts(msg_, linea_ = undefined) {
  if (win) {
    let obj;
    if (linea_) {
      obj = {
        linea: linea_,
        msg: msg_,
      };
    } else {
      obj = msg_;
    }
    win.webContents.send('log', obj);
  }
}

ipcMain.on('print', (event: any, oPdf) => {
  let obj;
  let todo_true = true;

  const data = oPdf.data;
  const type = oPdf.type;

  try {
    switch (type) {
      case 'recibo_ingreso':
        obj = recibosIngresos.makeRecibo(data);
        break;

      case 'conduce':
        obj = conduce.makeConduce(data);
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
  } catch (error) {
    puts(error, 207);
  }
});

function returnErrorPDF() {
  win.webContents.send('printRes', { msg: 'Error creando el pdf.', status: 'no' });
}

// ==========================================================================================================================================================
// MAKE PDF
// ==========================================================================================================================================================

function makePdf(dd, file) {
  const font_dir = getFuncionalPath('/fonts/roboto/Roboto');

  const fontDescriptors = {
    Roboto: {
      normal: font_dir + '-Regular.ttf',
      bold: font_dir + '-Bold.ttf',
      italics: font_dir + '-Italic.ttf',
      bolditalics: font_dir + '-BoldItalic.ttf',
    },
  };

  const printer = new pdfmake(fontDescriptors);

  // win.webContents.send('printRes', { msg: 'prueba', doc: JSON.stringify(dd), datos: data });
  puts('path donde guardara el pdf');
  const cFileName = getFuncionalPath('/' + file);
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
    puts(err, 280);
    win.webContents.send('printRes', { msg: 'Error creando factura!!', status: false, error: err });
  }
}

function imprimir(cFileName) {
  // const args = ['-print-to-default', '-print-settings "noscale,monochrome"', '-silent', cFileName];
  const { exec } = require('child_process');
  // "C:\Users\User\Desktop\factura.pdf" "EPSON LX-350 ESC/P"
  // exec(`${sumatrapdf_path} -print-to-default -print-settings "" ${cFileName}`, (error, stdout, stderr) => { });

  const foxitPath = getFuncionalPath() + 'print\\FoxitReaderPortable.exe';

  exec(`${foxitPath} /t "${getFuncionalPath('/' + cFileName)}"`, (error, stdout, stderr) => {
    if (error) {
      puts(error, 273);
      win.webContents.send('printRes', { msg: 'Error imprimiendo Factura!!', status: 'no', err: error });
      return;
    } else {
      console.log('stdout  ', stdout);
      console.log('stderr  ', stderr);
      win.webContents.send('printRes', { msg: 'Factura impresa correctamente!!', status: 'si' });
    }
  });
}

export function getFuncionalPath(addToPath = '') {
  let path_temp;
  let path_resolved;

  const args_ = process.argv.slice(1);
  const serve_ = args_.some((val) => val === '--serve');

  if (serve_) {
    console.log('');
    console.error('-=-=-=-=-=-=-=-= DESARROLLO -=-=-=-=-=-=-=-=-=-');

    path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;
  } else {
    console.error('-=-=-=-=-=-=-=-= PRODUCCION -=-=-=-=-=-=-=-=-=-');
    path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources/app.asar.unpacked';
  }
  path_temp = path_temp + addToPath;

  path_resolved = process.platform === 'darwin' ? path_temp : path_temp.split('/').join('\\');

  puts('path_resolved -->' + path_resolved);
  console.log('path_resolved ', path_resolved);

  console.error('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=--=-=-=');
  return path_resolved;
}

function fecha(a: any) {
  moment.locale('es');
  const fechaFormato = moment(a).format('DD/MM/YYYY');
  return fechaFormato;
}
