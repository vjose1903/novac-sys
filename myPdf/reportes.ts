import { logoADM, styles_ } from './utils/files';
import { AppConfig } from '../src/environments/environment.js';
import { getConfiguration } from './configuracion_tablas';
import { getContentWithTablaNormal } from './tabla_normal';
import { getContentWithTablaAgrupada } from './tabla_agrupada';

// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================

export function makeReporte(data) {
  console.log('data.tipo_reporte --> ', data.tipo_reporte);

  const configuration = getConfiguration(data.tipo_reporte);
  const dd = {
    // pageSize: { width: 990, height: 398 },
    pageMargins: [0, data.mostrar_sub_titulo ? 118.5 : 111.5, 0, 30],
    header: cabeceraReporte(data),
    content: contenidoReporte(data, configuration),
    footer: (currentPage, pageCount) => {
      return [
        {
          text: ' ',
          alignment: 'right',
          style: 'letra10',
          margin: [0, 0, 20, 0],
        },
      ];
    },
    images: {
      logo: logoADM,
    },
    styles: styles_,
  };

  const obj = {
    doc: dd,
    file: 'reporte.pdf',
    type: 'base64',
  };
  return obj;
}

// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraReporte(data) {
  const header = (currentPage, pageCount) => {
    const pag = currentPage.toString() + ' de ' + pageCount;
    return [
      {
        columns: [
          [{ image: 'logo', width: 52, opacity: 0.85, margin: [20, 12, 0, 0] }],

          [
            {
              margin: [0, 17, 0, 0],
              stack: [
                {
                  text: 'ADM Agroindustrial S.R.L',
                  alignment: 'center',
                  bold: true,
                  style: 'letra11_5',
                },
                {
                  text: 'Autopista Duarte Km0 El Higuero, La Vega',
                  alignment: 'center',
                  style: 'letra10',
                },
                {
                  text: [
                    { text: 'Telefono: ', style: 'letra9', bold: true },
                    { text: AppConfig.num_telefono, style: 'letra9' },
                    { text: ' RNC: ', style: 'letra9', bold: true },
                    { text: AppConfig.rnc, style: 'letra9' },
                  ],
                  alignment: 'center',
                },
              ],
            },
          ],
          [
            {
              text: [
                { text: 'Pag... :  ', style: 'letra10', bold: true },
                { text: pag, style: 'letra10' },
              ],
              alignment: 'left',
              margin: [60, 19, 0, 0],
            },
            {
              text: [
                { text: 'Fecha : ', style: 'letra10', bold: true },
                { text: data.fecha, style: 'letra10' },
              ],
              alignment: 'left',
              margin: [60, 3, 0, 0],
            },
            {
              text: [
                { text: 'Emp... :  ', style: 'letra10', bold: true },
                { text: data.realizado_por, style: 'letra10' },
              ],
              alignment: 'left',
              margin: [60, 3, 0, 0],
            },
          ],
        ],
      },
      {
        text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
        margin: [0, 15, 0, 0],
        alignment: 'center',
      },
      data.mostrar_sub_titulo
        ? {
            text: data.sub_titulo,
            style: 'letra10',
            margin: [15, 10, 0, 0],
          }
        : { text: '' },

      // data.tipo_tabla === 'normal' ?
      {
        canvas: [{ type: 'rect', x: 10, y: data.mostrar_sub_titulo ? 5 : 20, w: 575, h: 1.5, color: '#000000' }],
      },
      // : { text: '' },
    ];
  };

  return header;
}

// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================

function contenidoReporte(data, configuration) {
  let content = [];
  console.log('data.tipo_tabla --> ', data.tipo_tabla);

  if (data.tipo_tabla === 'agrupado') {
    console.log(':::::::::::: TABLA AGUPADA :::::::::::: ');
    content = getContentWithTablaAgrupada(configuration, data);
  } else {
    console.log(':::::::::::: TABLA NORMAL :::::::::::: ');
    content = getContentWithTablaNormal(configuration, data);
  }

  return content;
}

// const t_c = {
//   ventas: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     widths: [24, 60, 73, 53, '*', 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Fecha',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'fecha_equivalente',
//         alignment_body: 'left',
//         formato_fecha: true,
//       },
//       {
//         text: 'Factura',
//         style: 'letra10',
//         alignment_titulo: 'left',
//         style_body: 'letra10',
//         key: 'numero_comprobante',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Condición',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'condicion',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Cliente',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'cliente_nombre',
//         alignment_body: 'left',
//       },
//       // {
//       //   text: 'Descuento',
//       //   alignment_titulo: 'right',
//       //   margin_titulo: [0, 0, 20, 0],
//       //   margin_body: [0, 0, 20, 0],
//       //   style: 'letra10',
//       //   style_body: 'letra10',
//       //   key: 'descuento',
//       //   alignment_body: 'right',
//       //   formato_numero: true,
//       // },
//       {
//         text: 'Total Venta',
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'total_factura',
//         alignment_body: 'right',
//         formato_numero: true,
//       },
//     ],
//   },

//   cxc: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     // widths: [24, 65, 75, 55, '*', 'auto', 'auto'],
//     widths: [24, 60, 73, 53, '*', 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Fecha',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'fecha_equivalente',
//         alignment_body: 'left',
//         formato_fecha: true,
//       },
//       {
//         text: 'Factura',
//         style: 'letra10',
//         alignment_titulo: 'left',
//         style_body: 'letra10',
//         key: 'numero_comprobante',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Condición',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'condicion',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Cliente',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'cliente_nombre',
//         alignment_body: 'left',
//       },
//       // {
//       //   text: 'Descuento',
//       //   alignment_titulo: 'right',
//       //   margin_titulo: [0, 0, 20, 0],
//       //   margin_body: [0, 0, 20, 0],
//       //   style: 'letra10',
//       //   style_body: 'letra10',
//       //   key: 'descuento',
//       //   alignment_body: 'right',
//       //   formato_numero: true,
//       // },
//       {
//         text: 'Pendiente',
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'balance',
//         alignment_body: 'right',
//         formato_numero: true,
//       },
//     ],
//   },
//   //
//   //
//   //
//   //
//   cxc_ant: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     // widths: [24, 65, 75, 55, '*', 'auto', 'auto'],
//     widths: [18, '*', 60, 70, 70, 70, 70, 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Cliente',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'cliente_nombre',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Fecha',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'fecha_equivalente',
//         alignment_body: 'left',
//         formato_fecha: true,
//       },
//       {
//         text: '0 - 30 Dias',
//         style: 'letra10',
//         alignment_titulo: 'left',
//         style_body: 'letra10',
//         key: 'cero_to_treinta',
//         alignment_body: 'left',
//       },
//       {
//         text: '31 - 60 Dias',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'treinta_uno_to_sesenta',
//         alignment_body: 'left',
//       },
//       {
//         text: '61 - 90 Dias',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'sesenta_uno_to_noventa',
//         alignment_body: 'left',
//       },
//       {
//         text: 'mas 91 Dias',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'noventa_uno_to_more',
//         alignment_body: 'left',
//       },

//       {
//         text: 'Pendiente',
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'balance',
//         alignment_body: 'right',
//         formato_numero: true,
//       },
//     ],
//   },
//   inventario: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     widths: [24, 35, '*', 'auto', 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Cod.',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'codigo',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Articulo',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'nombre',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Cantidad',
//         style: 'letra10',
//         alignment_titulo: 'center',
//         style_body: 'letra10',
//         key: 'cantidad_principal',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Precio',
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'precio_principal',
//         alignment_body: 'right',
//         formato_numero: true,
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//       },
//     ],
//   },

//   recibos: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     widths: [24, 60, 70, '*', 50, 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Fecha',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'fecha_equivalente',
//         alignment_body: 'left',
//         formato_fecha: true,
//       },
//       {
//         text: 'Factura',
//         style: 'letra10',
//         alignment_titulo: 'left',
//         style_body: 'letra10',
//         key: 'factura',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Cliente',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'cliente_nombre',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Tipo',
//         style: 'letra10',
//         alignment_titulo: 'center',
//         style_body: 'letra10',
//         key: 'tipo_recibo',
//         alignment_body: 'center',
//       },

//       {
//         text: 'Recibido',
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'total',
//         alignment_body: 'right',
//         formato_numero: true,
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//       },
//     ],
//   },
//   ventas_prod: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     widths: [24, '*', 'auto', 'auto'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Articulo',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'nombre',
//         alignment_body: 'left',
//       },
//       {
//         text: 'Medida',
//         style: 'letra10',
//         alignment_titulo: 'left',
//         style_body: 'letra10',
//         key: 'medida_mostrar',
//         alignment_body: 'left',
//       },

//       {
//         text: 'Total Vendido',
//         alignment_titulo: 'right',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'total_vendido',
//         alignment_body: 'right',
//         formato_numero: true,
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//       },
//     ],
//   },
//   suplidor_prod: {
//     margin_general: [10, 0, 10, 0],
//     break: 40,
//     widths: [24, 60, '*'],
//     info: [
//       {
//         text: '#',
//         alignment_titulo: 'center',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'index',
//         alignment_body: 'center',
//       },
//       {
//         text: 'Fecha',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'fecha_equivalente',
//         alignment_body: 'left',
//         formato_fecha: true,
//       },
//       {
//         text: 'Suplidor',
//         alignment_titulo: 'left',
//         style: 'letra10',
//         style_body: 'letra10',
//         key: 'suplidor_nombre',
//         alignment_body: 'left',
//         margin_titulo: [0, 0, 10, 0],
//         margin_body: [0, 0, 10, 0],
//       },
//     ],
//   },
// };
