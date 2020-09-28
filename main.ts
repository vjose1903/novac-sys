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

// ipcMain.on('print', (event: any, arg) => {
//   makeFacturaVenta(JSON.parse(arg));
// });

// // ==========================================================================================================================================================
// // UNIR FACTURA VENTA
// // ==========================================================================================================================================================

// function makeFacturaVenta(DD) {
//   const type_font = process.platform === 'darwin' ? 'roboto/Roboto' : 'roboto\\Roboto';

//   const inicioRuta = process.platform === 'darwin' ? 'fonts/' : 'fonts\\';

//   const fontDescriptors = {
//     Roboto: {
//       normal: PathApp() + inicioRuta + type_font + '-Regular.ttf',
//       bold: PathApp() + inicioRuta + type_font + '-Bold.ttf',
//       italics: PathApp() + inicioRuta + type_font + '-Italic.ttf',
//       bolditalics: PathApp() + inicioRuta + type_font + '-BoldItalic.ttf',
//     },
//   };

//   const printer = new pdfmake(fontDescriptors);

//   // win.webContents.send('printRes', { msg: 'prueba', doc: JSON.stringify(DD), datos: data });
//   const cFileName = 'factura.pdf';
//   try {
//     const pdfDoc = printer.createPdfKitDocument(DD);
//     pdfDoc.pipe(fs.createWriteStream(cFileName)).on('finish', () => {
//       console.log('finizu');
//       win.webContents.send('printRes', { msg: 'Factura creada correctamente', status: 'prueba', body: DD, mas: JSON.stringify(DD) });
//       // imprimir(cFileName);
//     });
//     pdfDoc.end();
//   } catch (err) {
//     console.log('::::::::ERROR::::::::');
//     console.error(err);

//     win.webContents.send('printRes', { msg: 'Error creando factura!!', status: false, error: err });
//   }
// }

// function imprimir(cFileName) {
//   // const { exec } = require('child_process');
//   // "C:\Users\User\Desktop\factura.pdf" "EPSON LX-350 ESC/P"

//   // var foxitPath = PathApp() + 'print\\FoxitReaderPortable.exe';
//   // exec(`${foxitPath} /t "${PathApp()}factura.pdf"`, (error, stdout, stderr) => {
//   //   if (error) {
//   //     win.webContents.send('printRes', { msg: 'Error imprimiendo Factura!!', status: 'no', err: error });
//   //     return;
//   //   } else {
//   //     console.log('stdout  ', stdout);
//   //     console.log('stderr  ', stderr);
//   //     win.webContents.send('printRes', { msg: 'Factura impresa correctamente!!', status: 'si' });
//   //   }
//   // });

//   var sumatrapdf_path = PathApp() + 'print\\lp.exe';
//   // var bat = require.resolve(sumatrapdf_path);
//   // var profile = require.resolve('../profiles/app.profile.js');
//   var args = ['-print-to-default', '-print-settings "noscale,monochrome"', '-silent', cFileName];
//   const { exec } = require('child_process');
//   exec(`${sumatrapdf_path} -print-to-default -print-settings "noscale,monochrome" -silent ${cFileName}`, (error, stdout, stderr) => {
//     // if (error) {
//     //   console.error(`exec error: ${error}`);
//     //   return;
//     // }
//     // console.log(`stdout: ${stdout}`);
//     // console.log(`stderr: ${stderr}`);
//     // callback(true);
//   });
// }

// function PathApp() {
//   return app.getPath('exe').substr(0, app.getPath('exe').indexOf(app.getName() + '.exe'));
// }
ipcMain.on('print', (event: any, data) => {
  // data = JSON.parse(data);
  makeFacturaVenta(data);
});

// ==========================================================================================================================================================

function redondearAdos(num) {
  return (Math.round(num * 100) / 100).toFixed(2);
}

function formatearNumero(nStr) {
  if (nStr !== undefined) {
    nStr += '';
    const x = nStr.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }
}

function fecha(a: any) {
  moment.locale('es');
  const fechaFormato = moment(a).format('DD/MM/YYYY');
  return fechaFormato;
}
function hora(a: any) {
  moment.locale('es');
  const horaFormato = moment(a).format('hh:mm a');
  return horaFormato;
}
// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraFacturaVenta(data) {
  const header = [
    {
      columns: [
        [
          {
            image: 'logo',
            width: 72,
            opacity: 0.85,
            margin: [90, 0, 0, 0],
          },
        ],
        [
          {
            text: 'FACTURA A ' + _.toUpper(data.condicion),
            alignment: 'right',
            bold: true,
            fontSize: 14,
            margin: [0, 15, 30],
          },
          //
        ],
      ],
    },
    {
      margin: [0, -67, 0, 0],
      stack: [
        {
          text: 'ADM Agroindustrial S.R.L',
          alignment: 'center',
          bold: true,
          fontSize: 17,
        },
        {
          text: 'Autopista Duarte Km0 El Higuero, La Vega',
          alignment: 'center',
        },
        {
          text: [
            { text: 'Telefono: ', fontSize: 10 },
            { text: '809-572-0060 ', fontSize: 10 },
            { text: ' RNC: ', fontSize: 10 },
            { text: '131-99603-5', fontSize: 10 },
          ],
          alignment: 'center',
        },
      ],
    },

    {
      margin: [15, 10, 0, 0],
      columns: [
        [
          {
            text: [
              data.FACTURA_DE === 'venta' ? { text: 'Cliente : ', fontSize: 12 } : { text: 'Suplidor : ', fontSize: 12 },
              data.FACTURA_DE === 'venta' ? { text: data.cliente.nombre, fontSize: 12 } : { text: data.suplidor.nombre, fontSize: 12 },
            ],
            margin: [0, 0, 0, 0],
          },
          {
            text: [
              data.FACTURA_DE === 'venta' ? { text: 'Rnc cliente : ', fontSize: 12 } : { text: 'Rnc suplidor : ', fontSize: 12 },
              data.FACTURA_DE === 'venta' ? { text: data.cliente.rnc, fontSize: 12 } : { text: data.suplidor.rnc, fontSize: 12 },
            ],
            margin: [0, 5, 0, 0],
          },
          {
            text: [{ text: 'Dirección : ', fontSize: 12 }, data.FACTURA_DE === 'venta' ? { text: data.cliente.direccion, fontSize: 12 } : { text: data.suplidor.direccion, fontSize: 12 }],
            margin: [0, 5, 0, 0],
          },
        ],
        [
          {
            text: [{ text: data.tipo_factura, fontSize: 14 }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },
          data.FACTURA_DE === 'compra'
            ? {
                text: [{ text: '- - - COMPRA - - -', fontSize: 11 }],
                margin: [0, 1, 0, 0],
                alignment: 'center',
              }
            : { text: '' },
        ],
        [
          {
            stack: [
              {
                text: [
                  { text: 'Fecha : ', fontSize: 11.5 },
                  { text: fecha(data.created_at), fontSize: 11.5 },
                  { text: ' - ' + hora(data.created_at), fontSize: 11.5 },
                ],
                margin: [75, 0, 0, 0],
              },
              data.condicion === 'Contado'
                ? { text: '' }
                : {
                    text: [
                      { text: 'Fecha vencimiento : ', fontSize: 11.5 },
                      { text: fecha(data.fecha_vencimiento), fontSize: 11.5 },
                    ],
                    margin: [75, 3, 0, 0],
                  },

              {
                text: [
                  { text: 'NCF : ', fontSize: 11.5 },
                  { text: data.numero_comprobante, fontSize: 11.5 },
                ],
                margin: [75, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Fact No : ', fontSize: 11.5 },
                  { text: _.padStart(data.numero_factura, 8, '0'), fontSize: 11.5 },
                ],
                margin: [75, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Valida hasta : ', fontSize: 11.5 },
                  { text: fecha(data.fecha_valida), fontSize: 11.5 },
                ],
                margin: [75, 3, 0, 0],
              },
            ],
            margin: data.condicion === 'Contado' ? [-10, 0, 0, 0] : [-10, -5, 0, 0],
          },
        ],
      ],
    },

    // =============================================================
    {
      canvas: [
        {
          type: 'rect',
          x: 10,
          y: 3,
          w: 760,
          h: 2,
          color: '#000000',
        },
      ],
    },

    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [30, 233, '*', '*', '*', '*', '*'],
        body: [
          [
            { text: ' #', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
            { text: 'Articulo', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
            { text: 'Cantidad', style: 'tableHeader', bold: true, margin: [0, 0, 0, 0] },
            { text: 'Unidad', style: 'tableHeader', bold: true, margin: [0, 0, 0, 0] },
            data.FACTURA_DE === 'venta'
              ? { text: 'Precio', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] }
              : { text: 'Costo', style: 'tableHeader', bold: true, margin: [8, 0, 0, 0] },
            { text: 'Itbis', style: 'tableHeader', bold: true, margin: [0, 0, 0, 0] },
            { text: 'Total', style: 'tableHeader', bold: true, margin: [0, 0, 0, 0] },
          ],

          [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
        ],
      },
      margin: [10, 0, 0, 0],
      layout: 'headerLineOnly',
    },
  ];

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function calcularPrecio(cant, precio, tipo) {
  const res = cant * precio;
  return redondearAdos(res);
}

function contenidoFacturaVenta(data) {
  const tempBody = [];

  data.detalle_facturas.forEach((detalle, i) => {
    const row = [];

    row.push(
      i + 1,
      detalle.descripcion,
      formatearNumero(redondearAdos(detalle.cantidad)),
      detalle.unidad,
      formatearNumero(data.FACTURA_DE === 'venta' ? detalle.precio : detalle.costo),
      detalle.itbis !== 0 ? formatearNumero(redondearAdos(detalle.itbis)) : '',
      formatearNumero(redondearAdos(detalle.total)),
    );
    tempBody.push(row);
  });
  const content = [
    {
      style: 'tableExample',
      table: {
        widths: [24, 260, '*', '*', '*', '*', '*'],
        body: tempBody,
      },
      margin: data.condicion === 'Contado' ? [0, -2, 0, 0] : [0, -6, 0, 0],
      layout: {
        hLineWidth: (i, node) => {
          return i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: (i, node) => {
          return 0;
        },
        hLineColor: (i, node) => {
          return i === 0 || i === node.table.body.length || i === 1 ? 'black' : 'gray';
        },
        vLineColor: (i, node) => {
          return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
        },
      },
    },
    {
      text: [
        { text: 'Realizada Por:  ', fontSize: 11, bold: true },
        { text: data.usuario, fontSize: 11 },
      ],
      margin: [0, 5, 0, 0],
    },
    {
      stack: [
        {
          table: {
            body: [
              [
                { text: 'Bruto RD$: ', fontSize: 11, bold: true },
                { text: formatearNumero(redondearAdos(data.Bruto)), fontSize: 11, alignment: 'right' },
              ],
              [
                { text: 'Itbis RD$: ', fontSize: 11, bold: true },
                { text: formatearNumero(redondearAdos(data.itbis)), fontSize: 11, alignment: 'right' },
              ],
              [
                { text: 'Descuento RD$: ', fontSize: 11, bold: true },
                { text: formatearNumero(redondearAdos(data.descuento)), fontSize: 11, alignment: 'right' },
              ],
              [
                { text: 'TOTAL RD$: ', fontSize: 11, bold: true },
                { text: formatearNumero(redondearAdos(data.total_factura)), fontSize: 11, alignment: 'right' },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [595, 3, 0, 0],
        },
        {
          stack: [
            {
              canvas: [
                {
                  type: 'rect',
                  x: 40,
                  y: 0,
                  w: 140,
                  h: 1,
                  color: '#000000',
                },
                data.FACTURA_DE === 'venta'
                  ? {
                      type: 'rect',
                      x: 260,
                      y: 0,
                      w: 140,
                      h: 1,
                      color: '#000000',
                    }
                  : {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: 0,
                      h: 0,
                      color: '#ffffff',
                    },
              ],
              margin: [0, 30, 0, 0],
            },
            {
              columns: [
                [
                  {
                    text: [{ text: 'Revisada Por', fontSize: 12, bold: true }],
                    margin: [75, 5, 0, 0],
                  },
                ],
                [
                  data.FACTURA_DE === 'venta'
                    ? {
                        text: [{ text: 'Cliente', fontSize: 12, bold: true }],
                        margin: [-70, 5, 0, 0],
                      }
                    : { text: '' },
                ],
              ],
            },
          ],
          margin: [0, -40, 0, 0],
        },
      ],
      unbreakable: true,
    },
  ];

  return content;
}

// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================

function makeFacturaVenta(dd) {
  // const dd = {
  //   pageSize: { width: 760, height: 480 },
  //   pageMargins: data.condicion === 'Contado' ? [10, 157.9, 0, 40] : [10, 173, 0, 40],
  //   // pageMargins: data.condicion === 'Contado' ? [10, 157.5, 0, 40] : [10, 172.9, 0, 40],
  //   header: cabeceraFacturaVenta(data),
  //   content: contenidoFacturaVenta(data),
  //   footer: (currentPage, pageCount) => {
  //     return [
  //       {
  //         text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
  //         alignment: 'right',
  //         margin: [0, 0, 30, 0],
  //       },
  //       data.FACTURA_DE === 'venta'
  //         ? data.condicion === 'Contado'
  //           ? { text: '' }
  //           : {
  //               text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
  //               alignment: 'center',
  //               margin: [0, -15, 0, 0],
  //             }
  //         : { text: '' },
  //     ];
  //   },
  //   images: {
  //     logo: logoADM,
  //   },
  //   defaultStyle: {
  //     font: 'Roboto',
  //   },
  // };

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
  const cFileName = 'factura.pdf';
  try {
    const pdfDoc = printer.createPdfKitDocument(dd);
    pdfDoc.pipe(fs.createWriteStream(cFileName)).on('finish', () => {
      console.log('finizu');
      imprimir(cFileName);
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
  // exec(`"C:\\Program Files\\Adobe\\Reader 10.0\\Reader\\AcroRd32.exe" /t "C:\\Users\\User\\Documents\\proyectos\\ADM-Agroindustrial\\test.pdf" "EPSON LX-350 ESC/P"`, (error, stdout, stderr) => { });
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
