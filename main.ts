import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
import * as moment from 'moment';
var request = require('request');

const autoUpdater = require('electron-updater').autoUpdater;
const pdfmake = require('pdfmake/src/printer');

import * as facturasCompraVenta from './myPdf/facturasCompraVenta.js';
import * as recibosIngresos from './myPdf/recibosIngresos.js';
import * as conduce from './myPdf/conduce.js';

// tslint:disable: curly
// tslint:disable: one-variable-per-declaration
let win, serve;
let contador_descarga_fonts = 0;
let contador_descarga_print = 0;
const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');

let contents;

export let inicioRuta = __dirname;

function createWindow() {
  // autoUpdater.checkForUpdates();
  // verificarSumastra();
  verificarElemento('/fonts/fonts.zip', '', '/fonts.zip', '/fonts', true, true, 'Fuentes', 0);
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

  win.setMenuBarVisibility(false);

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
    message: 'VjPOS presenta una nueva actualizacion se empezará a descargar ahora.',
    detail: `Version a descargar: ${info.version}`,
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

function verificarSumastra() {
  let md5_servidor;

  if (!fs.existsSync(pathAdd('/print'))) {
    fs.mkdir(pathAdd('/print'), { recursive: true }, (err) => {
      if (err) {
        throw err;
      } else {
        console.log('------------- Carpeta print creada -------------');
      }
    });
  } else {
    console.log('------------- Carpeta print existe no es necesario crearla -------------');
  }
  verificarElemento('/sumastra/lp.exe', '/print', '/lp.exe', '/lp', false, false, 'Sumastra', 0);
}
escarga 
function esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_sin_extension, callback) {
  // const interval = setInterval(() => {
  console.log(`empezando a descomprimir archivo ${path_local_extension}`);
  console.log(`powershell Expand-Archive "${pathAdd(path_local_extension)}" -DestinationPath "${pathAdd()}"`);

 // cmd(`powershell Expand-Archive "${pathAdd(path_local_extension)}" -DestinationPath "${pathAdd(path_local_sin_extension)}"`, (res) => {
  cmd(`powershell Expand-Archive "${pathAdd(path_local_extension)}" -DestinationPath "${pathAdd()}"`, (res) => {
    if (res.status) {
      cmd(`del ${pathAdd(path_local_extension)}`, async (res_borrado) => {funcion deen el server ar
        if (res_borrado.status) {
          console.log('-----------------------------------');
          console.log('|    DESCOMPRESION FONTS EXITO    |');
          console.log('-----------------------------------');
          callback({
            status: true,
            msg: 'archivo descomprimido correctamente',
          });
          //clearInterval(interval);
        } else {
          console.log('ERROR  aquiiii descomprimir');

          callback({
            status: false,
            msg: 'error descomprimiendo archivo',
          });
        }
      });
    }
  });
  // }, 2000);
}

function borrado_de_archivos_malos(path_arciho_borrar, path_carpeta_borrar, is_carpeta, callback) {
  cmd(`del ${pathAdd(`${path_arciho_borrar}`)} ${is_carpeta ? `&& rmdir /s /q ${pathAdd(`${path_carpeta_borrar}`)}` : ''}`, async (res_borrado_distinto) => {
    console.log('res_borrado_distinto -->', res_borrado_distinto);

    if (res_borrado_distinto.status) {
      callback({
        status: true,
        msg: 'Elemento borrado correctamente',
      });
    } else {
      callback({
        status: false,
        msg: 'Error borrando elemento',
      });
    }
  });
}

async function verificarElemento(paht_server, path_local_content, path_local_extension, path_local_sin_extension, descomprimir, is_carpeta, nombre_err, counter) {
  console.log(`/////===== VERIFICANDO ${nombre_err.toUpperCase()} =====/////`);

  let lRetornar = false;
  let descargar_archivo = false;

  let md5_servidor;
  // cmd('ssh vjose1903@admservidor.ddns.net "md5sum /home/vjose1903/proyects/servidorADMAgro/public/fonts/fonts.zip"', async (res_servidor) => {
  cmd(`ssh vjose1903@admservidor.ddns.net "md5sum /home/vjose1903/proyects/servidorADMAgro/public${paht_server}`, async (res_servidor) => {
    if (res_servidor.status) {
      console.log(0);
      md5_servidor = res_servidor.STDOUT.split(' ')[0];
      console.log(`---------- md5 ${path_local_extension} servidor `, md5_servidor);
      console.log(' ');

      console.log('---------- path a ver si existe ---> ', pathAdd(`${path_local_content}${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}`));
      console.log(' ');

      console.log(' ');

      if (!fs.existsSync(pathAdd(`${path_local_content}${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}`))) {
        console.log('---------- El elemento ' + `${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}` + ' no existe, Procediendo a descarga');
        console.log(' ');
        procesoDescarga(path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_sin_extension, nombre_err, counter, is_carpeta);
        descargar_archivo = true;
      } else {
        console.log('////////---------- El elemento ' + `${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}` + ' si existe -----------////////');
        if (descomprimir) {
          console.log(
            '---------- El elemento ' + `${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}` + ' es una carpeta precediendo a comprimirla para comparar los md5',
          );
          console.log(' ');
          console.log(
            `########## powershell Compress-Archive "${pathAdd(`${path_local_sin_extension}`)}"  -DestinationPath "${pathAdd(`${path_local_sin_extension}.zip`)}" -Update #########`,
          );

          cmd(`powershell Compress-Archive "${pathAdd(`${path_local_sin_extension}`)}"  -DestinationPath "${pathAdd(`${path_local_sin_extension}.zip`)}" -Update`, (res_compresion) => {
            if (!res_compresion.status) {
              console.log(`---------- Error comprimiento el elemento ${path_local_extension}`);
              console.log(' ');
              retornarMensajeErrorVeiricandoElementos(nombre_err);
            } else {
              console.log(`---------- El elemento ${path_local_extension} comprimido correctamente`);
              console.log(' ');
              compararMD5(path_local_content, path_local_extension, md5_servidor, path_local_sin_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter);
            }
          });
        }
      }

      if (!descargar_archivo && !lRetornar && !descomprimir) {
        compararMD5(path_local_content, path_local_extension, md5_servidor, path_local_sin_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter);
      }

      if (descargar_archivo) {
      }
    }
    return;
  });
}

function compararMD5(path_local_content, path_local_extension, md5_servidor, path_local_sin_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter) {
  console.log(`---------- Procediendo a comparar los md5`);
  console.log(' ');
  console.log(`---------- Path donde esta el md5 a comparar --> ${pathAdd(`${path_local_content}${path_local_extension}`)}  `);
  console.log(' ');
  console.log(`CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5       <================`);

  cmd(`CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`, (res_local) => {
    console.log(1);
    console.log('res_local =>', res_local);

    const md5_local = res_local.STDOUT.split('\r\n')[1];
    console.log('---------- md5_servidor ', md5_servidor);
    console.log(' ');
    console.log('---------- md5_local ', md5_local);
    console.log(' ');

    if (md5_local !== md5_servidor) {
      console.log(`---------- Los md5 son diferentes procediendo a borrar elementos para descargarlos denuevo`);
      console.log(' ');
      borrado_de_archivos_malos(path_local_extension, path_local_sin_extension, is_carpeta, (res_del) => {
        console.log('MMMMMMMMM  ', res_del);
        
        if (res_del.status) {
          procesoDescarga(path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_sin_extension, nombre_err, counter, is_carpeta);
          console.log(`---------- borrado de archivos exitoso`);
          console.log(' ');
        } else {
          retornarMensajeErrorVeiricandoElementos(nombre_err);
          console.log(`---------- borrado de archivos fallido`);
          console.log(' ');
        }
      });
    }
  });
}

async function procesoDescarga(path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_sin_extension, nombre_err, counter, is_carpeta) {
  let descarga_exito = true;
  console.log(`---------- procediendo a descargar el archivo ${path_local_extension}`);
  console.log(' ');
  await downloadFile(`http://admservidor.ddns.net:3000${paht_server}`, path_local_content, path_local_extension, (res) => {
    if (res.status) {
      console.log(`---------- Creando el md5 de ${path_local_extension} --->  ${pathAdd(`${path_local_content}${path_local_extension}`)}   `);
      console.log(' ');

      cmd(`CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`, (res_local_before_descarga) => {
        console.log(2);
        const md5_local = res_local_before_descarga.STDOUT.split('\r\n')[1];
        console.log(`---------- md5 de ${path_local_extension} local`);
        console.log(' ');

        console.log('---------- md5_local ', md5_local);
        console.log(' ');
        console.log('---------- md5_servidor ', md5_servidor);
        console.log(' ');
        console.log('---------- res_local_before_descarga.status ', res_local_before_descarga.status);
        console.log(' ');
        console.log('---------- descomprimir ', descomprimir);
        console.log(' ');

        if (res_local_before_descarga.status) {
          if (md5_servidor === md5_local) {
            if (descomprimir) {
              esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_sin_extension, (res) => {
                if (res.status) {
                  console.log(`---------- DESCARGA EXITOSA`);
                  console.log(' ');
                } else {
                  win.webContents.send('err_descarga', {
                    msg: `Error en el proceso de verificacion de archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Víctor José Vásquez Santos.`,
                    status: 'no',
                  });
                  return;
                }
              });
            } else {
              console.log(`---------- DESCARGA EXITOSA`);
              console.log(' ');
            }
          } else {
            descarga_exito = false;
          }
        }
      });
    } else {
      descarga_exito = false;
    }
  });

  if (!descarga_exito) {
    counter++;
    if (counter <= 3) {
      console.log(`---------- fallo en la descarga de ${path_local_extension} intento numero ${counter}`);
      console.log(' ');
      verificarElemento(paht_server, path_local_content, path_local_extension, path_local_sin_extension, descomprimir, is_carpeta, nombre_err, counter);
    } else {
      console.log(`---------- Elemento ${path_local_extension} no se puede descargar comunicarse con Victor hablame despacio`);
      console.log(' ');
      win.webContents.send('err_descarga', {
        msg: `Error descargando archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Victor Jose Vasquez Santos.`,
        status: 'no',
      });
    }
  }
}

function retornarMensajeErrorVeiricandoElementos(nombre_err) {
  win.webContents.send('err_descarga', {
    msg: `Error en el proceso de verificacion de archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Víctor José Vásquez Santos.`,
    status: 'no',
  });
  return;
}

function cmd(command, callback) {
  const { exec } = require('child_process');
  exec(command, (error, stdout, stderr) => {
    let obj;
    if (error) {
      obj = {
        status: false,
        msg: error,
      };

      callback(obj);
    } else {
      obj = {
        status: true,
        msg: 'Comando realizado correctamente',
        STDOUT: stdout,
        STDERR: stderr,
      };
      callback(obj);
    }
  });
}

function downloadFile(archive_url, path, file_, callback = (arg) => {}) {
  // Save variable to know progress
  var received_bytes = 0;
  var total_bytes = 0;

  var req = request({
    method: 'GET',
    uri: archive_url,
  });

  console.log(`ruta donde se descargara el elemento ${pathAdd(`${path}${file_}`)}`);

  var out = fs.createWriteStream(pathAdd(`${path}${file_}`));
  req.pipe(out);

  req.on('response', function (data) {
    // Change the total bytes value to get progress later.
    total_bytes = parseInt(data.headers['content-length']);
  });

  req.on('data', function (chunk) {
    // Update the received bytes
    received_bytes += chunk.length;

    showProgress(received_bytes, total_bytes);
  });

  req.on('end', function () {
    callback({
      status: true,
      msg: 'descarga finalizada',
    });
  });
}

function showProgress(received, total) {
  var percentage = (received * 100) / total;
  console.log(percentage + '% | ' + received + ' bytes out of ' + total + ' bytes.');
}

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
    //console.log('puts.caller -->',puts.caller)

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
    puts(error, 259);
  }
});

function returnErrorPDF() {
  win.webContents.send('printRes', { msg: 'Error creando el pdf.', status: 'no' });
}

// ==========================================================================================================================================================
// MAKE PDF
// ==========================================================================================================================================================

function makePdf(dd, file) {
  const font_dir = pathAdd('/fonts/roboto/Roboto');

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
  const cFileName = pathAdd('/' + file);
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

  const foxitPath = pathAdd() + 'print\\FoxitReaderPortable.exe';

  exec(`${foxitPath} /t "${pathAdd('/' + cFileName)}"`, (error, stdout, stderr) => {
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

export function pathAdd(addToPath = '', pack = false) {
  let path_temp;
  let path_resolved;

  const args_ = process.argv.slice(1);
  const serve_ = args_.some((val) => val === '--serve');

  if (serve_) {
    path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;
  } else {
    if (pack) {
      path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources/app.asar';
    } else {
      path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources';
    }
  }
  path_temp = path_temp + addToPath;
  path_resolved = process.platform === 'darwin' ? path_temp : path_temp.split('/').join('\\');
  return path_resolved;
}

function fecha(a: any) {
  moment.locale('es');
  const fechaFormato = moment(a).format('DD/MM/YYYY');
  return fechaFormato;
}
