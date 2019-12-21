import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as _ from 'lodash';

import * as moment from 'moment';
import * as base64 from 'base64topdf';

// import * as pdfMake from 'pdfmake/src/print';
var pdfmake = require('pdfmake/src/printer');

import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { logoADM } from './files';

var win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

let contents;

export let inicioRuta = __dirname;

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
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
    win.loadURL('http://localhost:5200');
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
  var printersName = contents.getPrinters();
  event.sender.send('printersNameRes', printersName);
});

// function convert(base64) {
//   var imageBlob = dataURItoBlob(base64.base64);
//   return new File([imageBlob], base64.name, { type: 'application/pdf' });
// }

// function dataURItoBlob(dataURI) {
//   const byteString = window.atob(dataURI);

//   const arrayBuffer = new ArrayBuffer(byteString.length);
//   const int8Array = new Uint8Array(arrayBuffer);
//   for (let i = 0; i < byteString.length; i++) {
//     int8Array[i] = byteString.charCodeAt(i);
//   }
//   const blob = new Blob([int8Array], { type: 'application/pdf' });
//   return blob;
// }

ipcMain.on('test', (event: any, arg) => {
  let options = { silent: true };
  event.sender.send('testRes', 'llego' + arg);

  makeFacturaVenta(arg);
  //fs.open('./test.pdf').print(options, err => {
  //    if (!err) console.error('printing failed')
  //  else {
  //        console.error('succes')
  //      }
  //    });

  // var format = 'RAW';
  // var obj = {
  //   base64: arg,
  //   name: 'prueba',
  // };
  // var File = convert(obj);

  // function to create file from base64 encoded string

  // var data = fs.readFileSync(logoADM).toString()

  // print(options, err => {
  //     if (!err) console.error('printing failed')
  //     else {
  //       console.error('succes')
  //     }
  //   });

  // console.log(p.getPrinters())

  // console.log(data);

  // data.print(options, err => {
  //   if (!err) console.error('printing failed')
  //   else {
  //     console.error('succes')
  //   }
  // });

  // console.log(arg);

  // const PDF = makeFacturaVenta(arg);
  // console.log(PDF);

  // const options = { silent: true };

  // PDF.print(options, (success, errorType) => {
  //   if (success) {
  //     event.sender.send('testRes', 'todo Correcto');
  //   } else {
  //     event.sender.send('testRes', errorType);
  //   }
  // });
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
  console.log('CABEZA=============', data);

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
          {
            text: 'FACTURA A ' + _.toUpper(data.condicion),
            alignment: 'right',
            bold: true,
            fontSize: 14,
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
          fontSize: 17,
        },
        {
          text: 'Autopista Duarte Km0 El Higuero, La Vega',
          alignment: 'center',
        },
        {
          text: [
            { text: 'Telefono: ', fontSize: 9, bold: true },
            { text: '809-572-0060 ', fontSize: 9 },
            { text: ' RNC: ', fontSize: 9, bold: true },
            { text: '131-99603-5', fontSize: 9 },
          ],
          alignment: 'center',
        },
      ],
    },

    {
      margin: [30, 20, 0, 0],
      columns: [
        [
          {
            text: [{ text: 'Cliente: ', fontSize: 12, bold: true }, { text: data.cliente.nombre }],
            margin: [0, 0, 0, 0],
          },
          {
            text: [{ text: 'Rnc cliente: ', fontSize: 12, bold: true }, { text: data.cliente.rnc }],
            margin: [0, 5, 0, 0],
          },
          {
            text: [{ text: 'Dirección: ', fontSize: 12, bold: true }, { text: data.cliente.direccion }],
            margin: [0, 5, 0, 0],
          },
        ],
        [
          {
            text: [{ text: data.tipo_factura, fontSize: 14, bold: true }],
            margin: [0, 15, 0, 0],
            alignment: 'center',
          },
        ],
        [
          {
            text: [
              { text: 'Fecha: ', fontSize: 10, bold: true },
              { text: fecha(data.created_at), fontSize: 10 },
              { text: ' - ' + hora(data.created_at), fontSize: 10 },
            ],
            margin: [60, 0, 0, 0],
          },
          data.condicion === 'Contado'
            ? null
            : {
              text: [
                { text: 'Fecha vencimiento: ', fontSize: 10, bold: true },
                { text: fecha(data.fecha_vencimiento), fontSize: 10 },
              ],
              margin: [60, 3, 0, 0],
            },

          {
            text: [
              { text: 'NCF: ', fontSize: 10, bold: true },
              { text: data.numero_comprobante, fontSize: 10 },
            ],
            margin: [60, 3, 0, 0],
          },
          {
            text: [
              { text: 'Fact No: ', fontSize: 10, bold: true },
              { text: _.padStart(data.numero_factura, 8, '0'), fontSize: 10 },
            ],
            margin: [60, 3, 0, 0],
          },
          {
            text: [
              { text: 'Valida hasta: ', fontSize: 10, bold: true },
              { text: fecha(data.fecha_valida), fontSize: 10 },
            ],
            margin: [60, 3, 0, 0],
          },
        ],
      ],
    },

    // =============================================================
    {
      canvas: [
        {
          type: 'rect',
          x: 25,
          y: 5,
          w: 710,
          h: 2,
          color: '#000000',
        },
      ],
    },

    {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: [23, 233, '*', '*', '*', '*', '*'],
        body: [
          [
            { text: '#', style: 'tableHeader', bold: true },
            { text: 'Articulo', style: 'tableHeader', bold: true },
            { text: 'Cantidad', style: 'tableHeader', bold: true },
            { text: 'Unidad', style: 'tableHeader', bold: true },
            { text: 'Precio', style: 'tableHeader', bold: true },
            { text: 'Itbis', style: 'tableHeader', bold: true },
            { text: 'Total', style: 'tableHeader', bold: true },
          ],

          [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
        ],
      },
      margin: [25, 0, 25, 0],
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
  console.log('CONTENIDO=============', data);
  const tempBody = [];
  data.detalle_facturas.forEach((detalle, i) => {
    const row = [];

    row.push(
      i + 1,
      detalle.descripcion,
      formatearNumero(redondearAdos(detalle.cantidad)),
      detalle.unidad,
      formatearNumero(calcularPrecio(detalle.cantidad, detalle.precio, '')),
      detalle.itbis !== 0 ? formatearNumero(redondearAdos(detalle.itbis)) : '',
      formatearNumero(redondearAdos(detalle.total)),
    );
    tempBody.push(row);
  });
  const content = [
    {
      style: 'tableExample',
      table: {
        // headerRows: 1,
        // widths: [23, 250, '*', '*', '*', '*', '*'],
        widths: [24, 260, '*', '*', '*', '*', '*'],
        body: tempBody,
      },
      margin: data.condicion === 'Contado' ? [0, -2, 0, 0] : [0, -6, 0, 0],
      // margin: [0, 1, 0, 0],
      //  layout: 'lightHorizontalLines'
      layout: {
        hLineWidth: function (i, node) {
          return i === node.table.body.length ? 2 : 1;
        },
        vLineWidth: function (i, node) {
          return 0;
        },
        hLineColor: function (i, node) {
          return i === 0 || i === node.table.body.length || i === 1 ? 'black' : 'gray';
        },
        vLineColor: function (i, node) {
          return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
        },
      },
    },
    {
      text: [
        { text: 'Realizada Por:  ', fontSize: 11, bold: true },
        { text: 'Usuario', fontSize: 11 },
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
          margin: [530, 3, 0, 0],
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
                {
                  type: 'rect',
                  x: 260,
                  y: 0,
                  w: 140,
                  h: 1,
                  color: '#000000',
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
                  {
                    text: [{ text: 'Cliente', fontSize: 12, bold: true }],
                    margin: [-37, 5, 0, 0],
                  },
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

function makeFacturaVenta(data) {
  // console.log(data);
  console.log(data);

  // pdfMake.vfs = pdfFonts.pdfMake.vfs;
  // console.log(data);

  const dd = {
    pageSize: { width: 760, height: 480 },
    pageMargins: data.condicion === 'Contado' ? [25, 165.5, 25, 40] : [25, 184, 25, 40],
    header: cabeceraFacturaVenta(data),
    content: contenidoFacturaVenta(data),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
          alignment: 'right',
          margin: [0, 0, 30, 0],
        },
        data.condicion === 'Contado'
          ?
           null:  {
            text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
            alignment: 'center',
            margin: [0, -15, 0, 0],
          },
      ];
    },
    images: {
      logo: logoADM,
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };
  console.log('paso');

  // console.log(dd);

  const type_font = 'roboto\\Roboto';
  const fontDescriptors = {
    Roboto: {
      normal: PathApp() + 'fonts\\' + type_font + '-Regular.ttf',
      bold: PathApp() + 'fonts\\' + type_font + '-Bold.ttf',
      italics: PathApp() + 'fonts\\' + type_font + '-Italic.ttf',
      bolditalics: PathApp() + 'fonts\\' + type_font + '-BoldItalic.ttf',
    },
  };
  const printer = new pdfmake(fontDescriptors);

  const cFileName = 'test.pdf';
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

    win.webContents.send('testRes', 'Error creando factura!!');
  }
}

function imprimir(cFileName) {
  const sumatrapdf_path = PathApp() + 'print\\lp.exe';


  // var args = ['-print-to-default', '-print-settings "noscale,monochrome"', '-silent', cFileName];
  const { exec } = require('child_process');
  // "C:\Users\User\Desktop\test.pdf" "EPSON LX-350 ESC/P"
  // exec(`${sumatrapdf_path} -print-to-default -print-settings "" ${cFileName}`, (error, stdout, stderr) => { });

  exec(`${__dirname}"\\print\\FoxitReaderPortable.exe" /t "${__dirname}\\test.pdf" "EPSON LX-350 ESC/P"`, (error, stdout, stderr) => { 
    if(error){
      win.webContents.send('testRes', 'Error imprimiendo Factura!!');
      return;
    }else{
      console.log('stdout  ',stdout);
      console.log('stdout  ',stderr);
      
      win.webContents.send('testRes', 'Factura impresa correctamente!!');

    }

  });
  // exec(`"C:\\Program Files\\Adobe\\Reader 10.0\\Reader\\AcroRd32.exe" /t "C:\\Users\\User\\Documents\\proyectos\\ADM-Agroindustrial\\test.pdf" "EPSON LX-350 ESC/P"`, (error, stdout, stderr) => { });
}
function PathApp() {
  return app.getPath('exe').substr(0, app.getPath('exe').indexOf(app.getName() + '.exe'));
}
