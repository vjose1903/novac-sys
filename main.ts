import { app, BrowserWindow, screen, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

const request = require('request');
const { exec } = require('child_process');
// const autoUpdater = require('electron-updater').autoUpdater;

const express = require('express');

import Functions from './electron/functions.js';
import HandlerConfigFile from './electron/handler-config-file';

import {
  KEYWORD_ELECTRON_EVENT_DECRYPT,
  KEYWORD_ELECTRON_EVENT_ENCRYPT,
  KEYWORD_ELECTRON_GET_APP_CONFIG,
  KEYWORD_ELECTRON_PRINT_BASE64,
  KEYWORD_ELECTRON_RESPONSE,
  KEYWORD_ELECTRON_SENDER,
  KEYWORD_ELECTRON_SET_APP_CONFIG,
  KEYWORD_ELECTRON_TEST,
  MessageTaskInterface,
} from './electron/shared-electron-angular.js';
import AppUpdater from './electron/auto-update.js';

let win: BrowserWindow = null;
let auto_updater: AppUpdater = null;

const args = process.argv.slice(1);
const serve = args.some((val) => val === '--serve');

function createWindow() {
  return new Promise<BrowserWindow>((resolve, reject) => {
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
      // icon: process.platform === 'darwin' ? __dirname + '/icons/mac/icon.icns' : __dirname + '/icons/win/icon.ico',
      webPreferences: { nodeIntegration: true, allowRunningInsecureContent: serve ? true : false, contextIsolation: false },
    });

    if (serve) {
      win.webContents.openDevTools();

      require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`),
      });
      win.loadURL('http://localhost:5220');
    } else {
      win.loadURL(
        url.format({
          pathname: path.join(__dirname, 'dist/index.html'),
          protocol: 'file:',
          slashes: true,
        }),
      );
    }

    // if (serve) {
    //   win.webContents.openDevTools();

    //   require('electron-reload')(__dirname, {
    //     electron: require(path.join(__dirname, '/node_modules/electron')),
    //   });

    //   win.loadURL('http://localhost:5220');
    // } else {
    //   // Path when running electron executable
    //   let pathIndex = pathAdd('/dist/index.html');
    //   let baseDirectory = pathAdd('/dist/');

    //   // if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
    //   //   // Path when running electron in local folder
    //   //   pathIndex = '../dist/index.html';
    //   //   baseDirectory = '../dist';
    //   // }
    //   var httpPort = 5220;
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

    //   app.listen(httpPort, () => win.loadURL('http://localhost:5220'));

    //   // win.loadURL(url.format({
    //   //   pathname: path.join(__dirname, pathIndex),
    //   //   protocol: 'file:',
    //   //   slashes: true
    //   // }));
    // }

    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null;
    });

    resolve(win);
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    console.log(' ');
    console.log('=-=-=-=- READY -=-=-=-=');
    console.log(' ');

    createWindow()
      .then((res) => beforeCreateWindow(res))
      .catch(() => app.quit());
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd +
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null)
      createWindow()
        .then((res) => beforeCreateWindow(res))
        .catch(() => app.quit());
  });
} catch (e) {
  // Catch Error
  // throw e;
}

async function beforeCreateWindow(win_) {
  win = win_;

  verificarSumastra();
  borrarLogs();

  HandlerConfigFile.checkConfigFile();

  // ----- Manejar las actualizaciones -----
  auto_updater = new AppUpdater();
  auto_updater.handleUpdateEvents(win);
  // ---------------------------------------

  win.setMenuBarVisibility(false);
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
        console.log('AQUIIIII');

        const FileName = pathAdd('/factura.pdf');

        const options = { silent: true, deviceName: 'HP_Color_LaserJet_Prro_M479' };
        win.webContents.print(options, (success, errorType) => {
          console.log('success ', success);
          console.log('errorType ', errorType);
          if (success) {
            arg.response = success;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          } else {
            arg.response = errorType;
            event.reply(KEYWORD_ELECTRON_RESPONSE, arg);
          }
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
        const oPdf = JSON.parse(arg.data);

        const base64 = oPdf.base64;
        const fileName = oPdf.filename;
        const type = oPdf['type'] ? oPdf['type'] : 'reporte';
        const scale = oPdf['scale'] ? oPdf['scale'] : 'noscale';

        generatePdfFileFormBase64({ fileName, base64, type, scale })
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
        const args_ = process.argv.slice(1);
        const serve_ = args_.some((val) => val === '--serve');
        const pjson = require('./package.json');

        Functions.getConfigFile().then((config: any) => {
          arg.response = JSON.parse(config);

          arg.response['is_development'] = serve_;
          arg.response['printersList'] = win.webContents.getPrinters();
          arg.response['app_version'] = pjson.version;

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
// BORRA EL ARCHIVO DE LOGS
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function borrarLogs() {
  const carpeta = pathAdd('/log');

  if (!fs.existsSync(carpeta)) {
    fs.mkdir(carpeta, { recursive: true }, (err) => {
      if (err) {
        throw err;
      }
    });
  } else {
    // ya se creo la carpeta log
    setTimeout(() => {
      const comando = `del "${pathAdd('/log/my_log.txt')}"`;
      cmd(comando);
    }, 10000);
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// VEIRIFICA SI SUMASTRA ESTA INSTALADO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION QUE SE EJECUTA AL TERMINAR LA DESCARGA DE UN ELEMENTO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_no_extension, callback) {
  // const interval = setInterval(() => {

  const command =
    process.platform === 'darwin' ? `unzip "${pathAdd(path_local_extension)}" -d "${pathAdd()}"` : `powershell Expand-Archive "${pathAdd(path_local_extension)}" -DestinationPath "${pathAdd()}"`;

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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA BORRAR UN ELEMENTO QUE NO ESTE BIEN
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA VERIFICAR SI LOS ELEMENTOS NECESARIOS FUNCIONAN
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function verificarElemento(aFiles_malos, paht_server, path_local_content, path_local_extension, path_local_no_extension, descomprimir, is_carpeta, nombre_err, counter) {
  let descargar_archivo = false;
  let md5_servidor;

  cmd(`ssh vjose1903@admservidor.ddns.net "md5sum /home/vjose1903/proyects/servidorADMAgro/public${paht_server}"`, async (res_servidor) => {
    if (res_servidor.status) {
      md5_servidor = res_servidor.STDOUT.split(' ')[0];

      if (!fs.existsSync(pathAdd(`${path_local_content}${is_carpeta ? `${path_local_no_extension}` : `${path_local_extension}`}`))) {
        procesoDescarga(aFiles_malos, path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_no_extension, nombre_err, counter, is_carpeta);
        descargar_archivo = true;
      } else {
        if (descomprimir) {
          const command =
            process.platform === 'darwin'
              ? `zip -r "${pathAdd(path_local_extension)}" "${pathAdd(path_local_no_extension)}" -x "*.DS_Store"`
              : `powershell Compress-Archive "${pathAdd(`${path_local_no_extension}`)}"  -DestinationPath "${pathAdd(`${path_local_no_extension}.zip`)}" -Update`;

          cmd(command, (res_compresion) => {
            if (!res_compresion.status) {
              retornarMensajeErrorVeiricandoElementos(nombre_err);
            } else {
              compararMD5(aFiles_malos, path_local_content, path_local_extension, md5_servidor, path_local_no_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter);
            }
          });
        }
      }

      if (!descargar_archivo && !descomprimir) {
        compararMD5(aFiles_malos, path_local_content, path_local_extension, md5_servidor, path_local_no_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter);
      }
    } else {
    }
    return;
  });
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA COMPARA MD5 DE ELEMENTOS A VER SI FUNCIONAN
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function compararMD5(aFiles_malos, path_local_content, path_local_extension, md5_servidor, path_local_no_extension, is_carpeta, nombre_err, paht_server, descomprimir, counter) {
  const command =
    process.platform === 'darwin' ? `md5sum "${pathAdd(`${path_local_content}${path_local_extension}`)}"` : `CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`;

  cmd(command, (res_local) => {
    if (res_local.status) {
      const md5_local = process.platform === 'darwin' ? res_local.STDOUT.split(' ')[0] : res_local.STDOUT.split('\r\n')[1];
      if (md5_local !== md5_servidor) {
        borrado_de_archivos_malos(aFiles_malos, (res_del) => {
          if (res_del.status) {
            procesoDescarga(aFiles_malos, path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_no_extension, nombre_err, counter, is_carpeta);
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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PROCESO DE DESCARGA
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function procesoDescarga(aFiles_malos, path_local_extension, path_local_content, paht_server, md5_servidor, descomprimir, path_local_no_extension, nombre_err, counter, is_carpeta) {
  let descarga_exito = true;
  const confTemp = (await Functions.getConfigFile()) as any;
  const conf = JSON.parse(confTemp);

  if (conf.url_servidor_descargas) {
    await downloadFile(`${conf.url_servidor_descargas}${paht_server}`, path_local_content, path_local_extension, (res) => {
      if (res.status) {
        const command =
          process.platform === 'darwin' ? `md5sum "${pathAdd(`${path_local_content}${path_local_extension}`)}"` : `CertUtil -hashfile "${pathAdd(`${path_local_content}${path_local_extension}`)}" MD5`;

        cmd(command, (res_local_before_descarga) => {
          if (res_local_before_descarga.status) {
            const md5_local = process.platform === 'darwin' ? res_local_before_descarga.STDOUT.split(' ')[0] : res_local_before_descarga.STDOUT.split('\r\n')[1];
            if (md5_servidor === md5_local) {
              if (descomprimir) {
                esperandoDescargaParaDescomprimirElemento(path_local_content, path_local_extension, path_local_no_extension, (res) => {
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
        verificarElemento(aFiles_malos, paht_server, path_local_content, path_local_extension, path_local_no_extension, descomprimir, is_carpeta, nombre_err, counter);
      } else {
        win.webContents.send('err_descarga', {
          msg: `Error descargando archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Victor Jose Vasquez Santos.`,
          status: 'no',
        });
      }
    }
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// MENSAJE DE FALLA EN EL VERIFICADO DE ELEMENTOS
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function retornarMensajeErrorVeiricandoElementos(nombre_err) {
  win.webContents.send('err_descarga', {
    msg: `Error en el proceso de verificacion de archivo necesario para impresion << ${nombre_err} >>, Favor de comunicarse con Víctor José Vásquez Santos.`,
    status: 'no',
  });
  return;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION PARA EJECUTAR COMANDOS DE CONSOLA
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function cmd(command, callback = (arg) => {}) {
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
// FUNCION QUE SE ENCARGA DE DESCARGAR ARCHIVOS
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function downloadFile(archive_url, path, file_, callback = (arg) => {}) {
  // Save variable to know progress

  let received_bytes = 0;
  let total_bytes = 0;

  const req = request({ method: 'GET', uri: archive_url });

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

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA VER EL PROGRESO DE LA DESCARGA
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function showProgress(received, total) {
  const percentage = (received * 100) / total;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// FUNCION QUE SE ENCARGA DE VERIFICAR SI EL ARCHIVO LOG EXISTE
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

async function puts(msg, titulo?) {
  // cmd('ls');
  if (win) {
    const fs = require('fs');

    const carpeta = pathAdd('/log');
    const file = pathAdd('/log/my_log.txt');

    let texto = '';
    if (typeof msg === 'object') texto = JSON.stringify(msg, null, '\t');
    else if (typeof msg === 'number') texto = msg.toString();
    else texto = msg;

    if (!fs.existsSync(carpeta)) {
      fs.mkdir(carpeta, { recursive: true }, (err) => {
        if (err) {
          throw err;
        } else {
          escribirLogs(file, titulo, texto);
        }
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

function generatePdfFileFormBase64(params: { fileName: string; base64: string; type: string; scale: string }) {
  return new Promise((resolve, reject) => {
    const FileName = pathAdd('/' + params.fileName);

    try {
      fs.writeFile(FileName, params.base64, { encoding: 'base64' }, (err) => {
        imprimir({ fileName: params.fileName, tipo: params.type, scale: params.scale })
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    } catch (err) {
      reject({ msg: 'Error generando reporte!!', status: false, error: err });
    }
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// IMPRIMIR EL PDF
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function imprimir(params: { fileName: string; tipo: string; scale: string }) {
  return new Promise((resolve, reject) => {
    puts(`VOY A IMPRIMIR EL ARCHIVO ---> ${pathAdd(`/${params.fileName}`)}`);

    const sumatrapdf_path = pathAdd('/print/lp.exe');
    const file_path = pathAdd(`/${params.fileName}`);

    const orientation = params.tipo === 'reporte' ? 'Portrait' : 'landscape';
    const paper_size = params.tipo === 'reporte' ? 'letter' : 'VJPOS';

    const comando = `"${sumatrapdf_path}" -print-to-default -print-settings "${orientation},${params.scale},paper=${paper_size},simplex" -silent "${file_path}"`;

    cmd(comando, (res) => {
      if (res.status) resolve({ msg: 'PDF impreso correctamente!!', status: 'si', STDOUT: res });
      else reject({ msg: 'Error imprimiento PDF!!', status: 'no', err: res });
    });
  });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// PARA CREAR LA RUTA CORRECTA EN CASO DE SER COMPILADA O NO
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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
