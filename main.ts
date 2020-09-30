import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';
import * as moment from 'moment';
const pdfmake = require('pdfmake/src/printer');
import * as facturasCompraVenta from './facturasCompraVenta';
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

ipcMain.on('print', (event: any, data) => {
  const obj = facturasCompraVenta.makeFacturaVenta(data);
  const dd = obj.doc;
  const file = obj.file;
  makePdf(dd, file);
});

// ==========================================================================================================================================================

function redondearAdos(num) {
  const string = num + '';
  const splitStr = _.split(string, '.');

  let enteros = splitStr[0];

  const splitEnteros = _.split(enteros, ',');

  enteros = _.join(splitEnteros, '');

  let tempdecimales = splitStr[1];
  if (splitStr.length === 1) {
    tempdecimales = '00';
  }

  const decimales = tempdecimales.substring(0, 2);
  const Arreglo = [enteros, decimales];
  const numStr = _.join(Arreglo, '.');

  return parseFloat(numStr).toFixed(2);
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
// =========================================================================================================
function numFormatTwoDecimals(num) {
  return formatearNumero(redondearAdos(num));
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
  console.log('cliente ', data.cliente);
  console.log('factura de ', data.FACTURA_DE);
  console.log('########', data.tipo_factura_id);

  const header = [
    {
      columns: [
        [
          {
            image: 'logo',
            width: 72,
            opacity: 0.85,
            margin: [90, 12, 0, 0],
          },
        ],
        [
          data.FACTURA_DE === 'nota'
            ? { text: '' }
            : {
                text: 'FACTURA A ' + _.toUpper(data.condicion),
                alignment: 'right',
                bold: true,
                style: 'letra14',
                margin: [0, 20, 30],
              },
          //
        ],
      ],
    },
    {
      margin: [0, -62, 0, 0],
      stack: [
        {
          text: 'ADM Agroindustrial S.R.L',
          alignment: 'center',
          bold: true,
          style: 'letra17',
        },
        {
          text: 'Autopista Duarte Km0 El Higuero, La Vega',
          alignment: 'center',
        },
        {
          text: [
            { text: 'Telefono: ', style: 'letra10' },
            { text: '809-573-0060 ', style: 'letra10' },
            { text: ' RNC: ', style: 'letra10' },
            { text: '131-99603-5', style: 'letra10' },
          ],
          alignment: 'center',
        },
      ],
    },

    {
      margin: [15, 20, 0, 0],
      columns: [
        [
          {
            text: [
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Cliente : ', style: 'letra12' } : { text: 'Suplidor : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.nombre, style: 'letra12' } : { text: data.suplidor.nombre, style: 'letra12' },
            ],
            margin: [0, 0, 0, 0],
          },
          {
            text: [
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Rnc cliente : ', style: 'letra12' } : { text: 'Rnc suplidor : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.rnc, style: 'letra12' } : { text: data.suplidor.rnc, style: 'letra12' },
            ],
            margin: [0, 5, 0, 0],
          },
          {
            text: [
              { text: 'Dirección : ', style: 'letra12' },
              data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.direccion, style: 'letra12' } : { text: data.suplidor.direccion, style: 'letra12' },
            ],
            margin: [0, 5, 0, 0],
          },
        ],
        [
          {
            text: [{ text: data.tipo_factura, style: 'letra14' }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },

          data.FACTURA_DE === 'compra'
            ? {
                text: [{ text: '- - - COMPRA - - -', style: 'letra11' }],
                margin: [0, 1, 0, 0],
                alignment: 'center',
              }
            : { text: '' },

          data.FACTURA_DE === 'nota'
            ? {
                text: [
                  { text: 'Aplicada a: ', style: 'letra11' },
                  { text: data.aplicada_a, style: 'letra11' },
                ],
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
                  { text: 'Fecha : ', style: 'letra11' },
                  { text: fecha(data.created_at), style: 'letra11' },
                  { text: ' - ' + hora(data.created_at), style: 'letra11' },
                ],
                margin: [75, 0, 0, 0],
              },
              (data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' || data.FACTURA_DE === 'compra') && data.condicion === 'Contado'
                ? { text: '' }
                : {
                    text: [
                      { text: 'Fecha vencimiento : ', style: 'letra11' },
                      { text: fecha(data.fecha_vencimiento), style: 'letra11' },
                    ],
                    margin: [75, 3, 0, 0],
                  },
              {
                text: [
                  { text: 'NCF : ', style: 'letra11' },
                  { text: data.numero_comprobante, style: 'letra11' },
                ],
                margin: [75, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Doc No : ', style: 'letra11' },
                  { text: _.padStart(data.numero_factura, 8, '0'), style: 'letra11' },
                ],
                margin: [75, 3, 0, 0],
              },
              {
                text: [
                  { text: 'Valida hasta : ', style: 'letra11' },
                  data.tipo_factura_id === 3 ? { text: 'No aplica.', style: 'letra11' } : data.FACTURA_DE === 'compra' ? { text: ' ' } : { text: fecha(data.fecha_valida), style: 'letra11' },
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
          w: 740,
          h: 2,
          color: '#000000',
        },
      ],
    },

    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [30, 245, 65, '*', '*', '*', '*'],
        body: [
          [
            { text: ' #', style: 'tableHeader', bold: true, margin: [4, 0, 0, 0] },
            { text: 'Articulo', style: 'tableHeader', bold: true, margin: [-10, 0, 0, 0] },
            { text: 'Cantidad', style: 'tableHeader', bold: true }, // margin: [5, 0, 0, 0]
            { text: 'Unidad', style: 'tableHeader', bold: true, margin: [3, 0, 0, 0] }, // margin: [-1, 0, 0, 0]
            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
              ? { text: 'Precio', style: 'tableHeader', bold: true, margin: [13, 0, 0, 0] }
              : { text: 'Costo', style: 'tableHeader', bold: true, margin: [14, 0, 0, 0] },
            { text: 'Itbis', style: 'tableHeader', bold: true, margin: [10, 0, 0, 0] },
            { text: 'Total', style: 'tableHeader', bold: true }, // margin: [12, 0, 0, 0]
          ],

          [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
        ],
      },
      margin: [10, 0, 10, 0],
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
      { text: numFormatTwoDecimals(detalle.cantidad), alignment: 'right', margin: [0, 0, 25, 0] },
      { text: detalle.unidad, margin: [8, 0, 0, 0] },
      { text: numFormatTwoDecimals(data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? detalle.precio : detalle.costo), alignment: 'right', margin: [0, 0, 10, 0] },
      { text: numFormatTwoDecimals(detalle.itbis), alignment: 'right', margin: [0, 0, 32, 0] },
      { text: numFormatTwoDecimals(detalle.total), alignment: 'right', margin: [0, 0, 26, 0] },
    );
    tempBody.push(row);
  });
  const content = [
    {
      style: 'tableExample',
      table: {
        widths: [24, 240, '*', 55, '*', '*', '*'],
        body: tempBody,
      },
      margin: data.condicion === 'Contado' ? [0, -19, 10, 0] : [0, -6, 10, 0],
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
        { text: 'Realizada Por :  ', style: 'letra11', bold: true },
        { text: data.usuario, style: 'letra11' },
        data.vendedor ? { text: '    Vendedor :  ', style: 'letra11', bold: true } : { text: '' },
        data.vendedor ? { text: data.vendedor, style: 'letra11' } : { text: '' },
      ],
      margin: [0, 5, 0, 0],
    },

    {
      stack: [
        {
          table: {
            body: [
              [
                { text: 'Bruto RD$: ', style: 'letra11', bold: true },
                { text: numFormatTwoDecimals(data.Bruto), style: 'letra11', alignment: 'right' },
              ],
              [
                { text: 'Itbis RD$: ', style: 'letra11', bold: true },
                { text: numFormatTwoDecimals(data.itbis), style: 'letra11', alignment: 'right' },
              ],
              [
                { text: 'Descuento RD$: ', style: 'letra11', bold: true },
                { text: numFormatTwoDecimals(data.descuento), style: 'letra11', alignment: 'right' },
              ],
              [
                { text: 'TOTAL RD$: ', style: 'letra11', bold: true },
                { text: numFormatTwoDecimals(data.total_factura), style: 'letra11', alignment: 'right' },
              ],
              data.FACTURA_DE === 'compra' || data.FACTURA_DE === 'nota'
                ? [{ text: '' }, { text: '' }]
                : [
                    { text: 'Devuelta RD$: ', style: 'letra11', bold: true },
                    { text: numFormatTwoDecimals(data.devuelta), style: 'letra11', alignment: 'right' },
                  ],
            ],
          },
          layout: 'noBorders',
          margin: [585, 3, 0, 0],
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
                data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
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
                    text: [{ text: 'Revisada Por', style: 'letra12', bold: true }],
                    margin: [75, 5, 0, 0],
                  },
                ],
                [
                  data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
                    ? {
                        text: [{ text: 'Cliente', style: 'letra12', bold: true }],
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
