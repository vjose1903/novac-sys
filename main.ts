import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
var request = require('request');
const { exec } = require('child_process');
const autoUpdater = require('electron-updater').autoUpdater;
const pdfmake = require('pdfmake/src/printer');
const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import * as facturasCompraVenta from './myPdf/facturasCompraVenta';
import * as recibosIngresos from './myPdf/recibosIngresos';
import * as conduce from './myPdf/conduce';
import * as cuadreCaja from './myPdf/cuadreCaja';
import * as reportes from './myPdf/reportes';
import { AppConfig } from './src/environments/environment.js';

// tslint:disable: curly
// tslint:disable: one-variable-per-declaration
let win, serve;

const args = process.argv.slice(1);
serve = args.some((val) => val === '--serve');

let contents;

export let inicioRuta = __dirname;

function createWindow() {
  // autoUpdater.checkForUpdates();

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
  verificarSumastra();
  borrarLogs();

  // win.webContents.openDevTools();

  win.setMenuBarVisibility(false);

  autoUpdater.checkForUpdatesAndNotify();

  // Emitted when the window is closed.

  win.on('closed', (event) => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

    event.preventDefault();
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
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Reiniciar'],
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

autoUpdater.on('update-not-available', (info) => {});

autoUpdater.on('error', (error) => {
  if (win) {
    win.webContents.send('update-error', { msg: 'Error descargando actualizacion...', body: error });
  }
  console.error('error', error);
});

// ==========================================================================================================================================================
ipcMain.on('printerNames', (event: any, arg) => {
  // name of function
  const printersName = win.webContents.getPrinters();

  event.reply('printersNameRes', printersName);
});

ipcMain.on('getVersion', (event: any, arg) => {
  // name of function

  const pjson = require('./package.json');

  event.reply('versionResponse', pjson.version);
});

ipcMain.on('getAppDir', (event: any, arg) => {
  event.reply('getAppDirResponse', pathAdd());
});

function borrarLogs() {
  cmd('dir', (res) => {
    puts(res.STDOUT, '----------- dir -----------');
  });

  puts('entro enla funcion de borrar log');
  setTimeout(() => {
    puts('ahora va a borrar el archivo log');
    const comando = `del "${pathAdd('/my_log.txt', false)}"`;
    console.log('comando para borrar ==> ' + comando);
    cmd(comando);
  }, 10000);
}

function verificarSumastra() {
  if (!fs.existsSync(pathAdd('/print'))) {
    fs.mkdir(pathAdd('/print'), { recursive: true }, (err) => {
      if (err) {
        throw err;
      } else {
      }
    });
  } else {
  }

  const aFiles_malos = [pathAdd('/lp.exe')];

  verificarElemento(aFiles_malos, '/sumastra/lp.exe', '/print', '/lp.exe', '/lp', false, false, 'Sumastra', 0);
}

function esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_sin_extension, callback) {
  // const interval = setInterval(() => {

  const command =
    process.platform === 'darwin'
      ? `unzip "${pathAdd(path_local_extension)}" -d "${pathAdd()}"`
      : `powershell Expand-Archive "${pathAdd(path_local_extension)}" -DestinationPath "${pathAdd()}"`;

  cmd(command, (res) => {
    if (res.status) {
      cmd(`del ${pathAdd(path_local_extension)}`, async (res_borrado) => {
        if (res_borrado.status) {
          callback({
            status: true,
            msg: 'archivo descomprimido y borrado del zip correctamente',
          });
          // clearInterval(interval);
        } else {
          callback({
            status: false,
            msg: `error borrando ${path_local_extension}`,
          });
        }
      });
    } else {
      callback({
        status: false,
        msg: 'error descomprimiendo archivo',
      });
    }
  });
  // }, 2000);
}

async function borrado_de_archivos_malos(archivos, callback = (arg) => {}) {
  const del = require('del');

  // delete directory recursively

  try {
    await del(archivos);
    callback({
      status: true,
      msg: 'Elementos borrado correctamente',
    });
  } catch (err) {
    console.error(`Error borrando ${archivos} .`);
    callback({
      status: false,
      msg: err,
    });
  }
}

async function verificarElemento(
  aFiles_malos,
  paht_server,
  path_local_content,
  path_local_extension,
  path_local_sin_extension,
  descomprimir,
  is_carpeta,
  nombre_err,
  counter,
) {
  let descargar_archivo = false;

  let md5_servidor;
  cmd(`ssh vjose1903@admservidor.ddns.net "md5sum /home/vjose1903/proyects/servidorADMAgro/public${paht_server}"`, async (res_servidor) => {
    if (res_servidor.status) {
      md5_servidor = res_servidor.STDOUT.split(' ')[0];

      if (!fs.existsSync(pathAdd(`${path_local_content}${is_carpeta ? `${path_local_sin_extension}` : `${path_local_extension}`}`))) {
        procesoDescarga(
          aFiles_malos,
          path_local_extension,
          path_local_content,
          paht_server,
          md5_servidor,
          descomprimir,
          path_local_sin_extension,
          nombre_err,
          counter,
          is_carpeta,
        );
        descargar_archivo = true;
      } else {
        if (descomprimir) {
          const command =
            process.platform === 'darwin'
              ? `zip -r "${pathAdd(path_local_extension)}" "${pathAdd(path_local_sin_extension)}" -x "*.DS_Store"`
              : `powershell Compress-Archive "${pathAdd(`${path_local_sin_extension}`)}"  -DestinationPath "${pathAdd(
                  `${path_local_sin_extension}.zip`,
                )}" -Update`;

          cmd('pwd', (res_pwd) => {});

          cmd(command, (res_compresion) => {
            if (!res_compresion.status) {
              retornarMensajeErrorVeiricandoElementos(nombre_err);
            } else {
              compararMD5(
                aFiles_malos,
                path_local_content,
                path_local_extension,
                md5_servidor,
                path_local_sin_extension,
                is_carpeta,
                nombre_err,
                paht_server,
                descomprimir,
                counter,
              );
            }
          });
        }
      }

      if (!descargar_archivo && !descomprimir) {
        compararMD5(
          aFiles_malos,
          path_local_content,
          path_local_extension,
          md5_servidor,
          path_local_sin_extension,
          is_carpeta,
          nombre_err,
          paht_server,
          descomprimir,
          counter,
        );
      }
    } else {
    }
    return;
  });
}

function compararMD5(
  aFiles_malos,
  path_local_content,
  path_local_extension,
  md5_servidor,
  path_local_sin_extension,
  is_carpeta,
  nombre_err,
  paht_server,
  descomprimir,
  counter,
) {
  const command =
    process.platform === 'darwin'
      ? `md5sum "${pathAdd(`${path_local_content}${path_local_extension}`)}"`
      : `CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`;

  cmd(command, (res_local) => {
    if (res_local.status) {
      const md5_local = process.platform === 'darwin' ? res_local.STDOUT.split(' ')[0] : res_local.STDOUT.split('\r\n')[1];
      if (md5_local !== md5_servidor) {
        borrado_de_archivos_malos(aFiles_malos, (res_del) => {
          if (res_del.status) {
            procesoDescarga(
              aFiles_malos,
              path_local_extension,
              path_local_content,
              paht_server,
              md5_servidor,
              descomprimir,
              path_local_sin_extension,
              nombre_err,
              counter,
              is_carpeta,
            );
          } else {
            retornarMensajeErrorVeiricandoElementos(nombre_err);
          }
        });
      }
    } else {
      retornarMensajeErrorVeiricandoElementos(nombre_err);
    }
  });
}

async function procesoDescarga(
  aFiles_malos,
  path_local_extension,
  path_local_content,
  paht_server,
  md5_servidor,
  descomprimir,
  path_local_sin_extension,
  nombre_err,
  counter,
  is_carpeta,
) {
  let descarga_exito = true;

  await downloadFile(`${AppConfig.url_descargas}${paht_server}`, path_local_content, path_local_extension, (res) => {
    if (res.status) {
      const command =
        process.platform === 'darwin'
          ? `md5sum "${pathAdd(`${path_local_content}${path_local_extension}`)}"`
          : `CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`;

      cmd(command, (res_local_before_descarga) => {
        if (res_local_before_descarga.status) {
          const md5_local =
            process.platform === 'darwin' ? res_local_before_descarga.STDOUT.split(' ')[0] : res_local_before_descarga.STDOUT.split('\r\n')[1];
          if (md5_servidor === md5_local) {
            if (descomprimir) {
              esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_sin_extension, (res) => {
                if (res.status) {
                } else {
                  win.webContents.send('err_descarga', {
                    msg: `Error en el proceso de verificacion de archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Víctor José Vásquez Santos.`,
                    status: 'no',
                  });
                  return;
                }
              });
            }
          } else {
            descarga_exito = false;
          }
        } else {
          retornarMensajeErrorVeiricandoElementos(nombre_err);
        }
      });
    } else {
      descarga_exito = false;
    }
  });

  if (!descarga_exito) {
    counter++;
    if (counter <= 3) {
      verificarElemento(
        aFiles_malos,
        paht_server,
        path_local_content,
        path_local_extension,
        path_local_sin_extension,
        descomprimir,
        is_carpeta,
        nombre_err,
        counter,
      );
    } else {
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

function cmd(command, callback = (arg) => {}) {
  puts(command, 'comando realizado en la funcion cmd');
  exec(command, (error, stdout, stderr) => {
    let obj;
    if (error) {
      obj = {
        status: false,
        STDOUT: stdout,
        STDERR: stderr,
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

  let received_bytes = 0;
  let total_bytes = 0;

  const req = request({
    method: 'GET',
    uri: archive_url,
  });

  const out = fs.createWriteStream(pathAdd(`${path}${file_}`));
  req.pipe(out);

  req.on('response', (data) => {
    // Change the total bytes value to get progress later.
    total_bytes = parseInt(data.headers['content-length']);
  });

  req.on('data', (chunk) => {
    // Update the received bytes
    received_bytes += chunk.length;

    showProgress(received_bytes, total_bytes);
  });

  req.on('end', () => {
    callback({
      status: true,
      msg: 'descarga finalizada',
    });
  });
}

function showProgress(received, total) {
  const percentage = (received * 100) / total;
}

async function puts(msg, titulo?) {
  if (win) {
    const fs = require('fs');
    const file = 'my_log.txt';

    let texto = '';
    if (typeof msg === 'object') {
      texto = JSON.stringify(msg, null, '\t');
    } else if (typeof msg === 'number') {
      texto = msg.toString();
    } else {
      texto = msg;
    }

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
}

ipcMain.on('printReporte', async (event: any, oPdf) => {
  await puts(' --------------- INICIO DE PROCESO DE IMPRESION DE REPORTES --------------- ');
  const base64 = oPdf.base64;
  const filename = oPdf.filename;
  await puts(base64, 'base64');
  await puts(filename, 'filename');
  generatePdfFileFormBase64(filename, base64);
});

ipcMain.on('print', async (event: any, oPdf) => {
  await puts(' --------------- INICIO DE PROCESO DE IMPRESION --------------- ');

  let obj;
  let todo_true = true;

  console.log('data --> ' + oPdf.data);
  console.log('type --> ' + oPdf.type);
  console.log('oPdf.data.reimprimir --> ' + oPdf.data.reimprimir);
  const data = oPdf.data;
  const type = oPdf.type;
  const reimprimir = oPdf.data.reimprimir ? true : false;

  data['reimprimir'] = reimprimir;

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

      case 'cuadre_caja':
        obj = cuadreCaja.makeCuadre(data);
        break;

      case 'reporte':
        console.log('entro en el case de reporte');
        obj = reportes.makeReporte(data);
        break;

      default:
        todo_true = false;
        break;
    }

    if (todo_true) {
      const dd = obj.doc;
      const file = obj.file;
      const type = obj.type;

      createPdfbase64(dd, file, type, reimprimir);
    } else {
      returnErrorPDF();
    }
  } catch (error) {
    puts(obj, 'error en el switch de tipos de archivo para escribir');
  }
});

function returnErrorPDF() {
  win.webContents.send('printRes', { msg: 'Error escribiendo el pdf.', status: 'no' });
}

// ==========================================================================================================================================================
// MAKE PDF
// ==========================================================================================================================================================

function generatePdfFileFormBase64(cFileName, base64, type = 'reporte') {
  const FileName = pathAdd('/' + cFileName);
  puts(cFileName, 'cFileName');
  puts(base64, 'base64');
  puts(type, 'type');
  try {
    fs.writeFile(FileName, base64, { encoding: 'base64' }, (err) => {
      puts('PASOO EL METODO QUE CREA EL ARCHIVO PDF');
      imprimir(cFileName, type);
    });
  } catch (err) {
    puts(err, 'createPdfFileFormBase64 ERROR');
    win.webContents.send('printReporteRes', { msg: 'Error generando reporte!!', status: false, error: err });
  }
}

function createPdfbase64(docDefinition, file_, type, reimprimir_) {
  try {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    pdfDocGenerator.getBase64((data) => {
      if (type === 'file') {
        generatePdfFileFormBase64(file_, data, type);
      } else {
        win.webContents.send('printRes', {
          msg: 'Pdf Base64 correcto',
          file: file_,
          status: 'si',
          reimprimir: reimprimir_,
          body: data,
          sbody: JSON.stringify(data),
        });
      }
    });
  } catch (error) {
    puts(error, 'createPdfbase64 ERROR');
    returnErrorPDF();
    throw error;
  }
}

function imprimir(cFileName, tipo) {
  puts('ENTRO EN LA FUNCION DE IMPRIMIR');
  const sumatrapdf_path = pathAdd('/print/lp.exe');
  const file_path = pathAdd(`/${cFileName}`);
  puts(tipo, 'EL MALDITO TIPO');
  puts(file_path, 'file_path');
  puts(sumatrapdf_path, 'sumatrapdf_path');
  // const bat = require.resolve(sumatrapdf_path);
  // const profile = require.resolve('../profiles/app.profile.js');
  // const args = ['-print-to-default', '-print-settings "landscape,fit,"', '-silent', cFileName];
  //exec(`${sumatrapdf_path} -print-to-default -print-settings "noscale,landscape" -silent ${cFileName}`, (error, stdout, stderr) => {
  const comando = `"${sumatrapdf_path}" -print-to-default -print-settings "landscape,noscale,paper=VJPOS,simplex" -silent "${file_path}"`;
  cmd(comando, (res) => {
    puts(res, 'respuesta impresion');

    let msg_;
    let tipo_;
    if (res.status) {
      if (tipo === 'reporte') {
        msg_ = 'Reporte generado correctamente!!';
        tipo_ = 'printReporteRes';
      } else {
        msg_ = 'Factura generada correctamente!!';
        tipo_ = 'printRes';
      }
      console.log(`MALDITO TIPO--> ${tipo_}`);
      console.log(`SEND ANGULAR ${tipo_} ${msg_}`);
      puts(`SEND ANGULAR ${tipo_} ${msg_}`);
      win.webContents.send(tipo_, { msg: msg_, status: 'si', STDOUT: res });
    } else {
      if (tipo === 'reporte') {
        msg_ = 'Error generando Reporte!!';
        tipo_ = 'printReporteRes';
      } else {
        msg_ = 'Error generando Factura!!';
        tipo_ = 'printRes';
      }
      console.log(`ERROR MALDITO TIPO--> ${tipo_}`);
      console.log(`ERROR SEND ANGULAR ${tipo_} ${msg_}`);
      puts(`SEND ANGULAR ${tipo_} ${msg_}`);
      win.webContents.send(tipo_, { msg: msg_, status: 'no', err: res });
      return;
    }
  });
}

export function pathAdd(addToPath = '', resource = true) {
  let path_temp;
  let path_resolved;

  const args_ = process.argv.slice(1);
  const serve_ = args_.some((val) => val === '--serve');

  if (serve_) {
    path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;
  } else {
    if (resource) {
      path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name + '/resources';
    } else {
      path_temp = app.getPath('exe').substr(0, app.getPath('exe').toLowerCase().indexOf(app.name.toLowerCase())) + app.name;
    }
  }
  path_temp = path_temp + addToPath;
  path_resolved = process.platform === 'darwin' ? path_temp : path_temp.split('/').join('\\');
  return path_resolved;
}
