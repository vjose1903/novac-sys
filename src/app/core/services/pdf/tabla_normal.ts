/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './utils/funciones';

export function getContentWithTablaNormal(configuration, data) {
  return makeTablaNormal(configuration, data);
}

export function getTablaNormal(configuration, data, index_data?, index_info?) {
  return makeTablaNormal(configuration, data, index_data, index_info);
}

export function makeTablaNormal(configuration, data, index_data?, index_info?) {
  const data_ = data.tipo_tabla === 'normal' ? data : data.contenido_reporte[index_data];

  const contendio_ = data.tipo_tabla === 'normal' ? data_.contenido_reporte : index_info == 0 ? data_.contenido_titulo : data_.contenido_grupo;

  const titulos = [];
  const body = [];

  configuration.info.forEach((titulo_config, i) => {
    try {
      const obj_titulo = {
        text: configuration.only_titulo ? contendio_ : titulo_config.text,
        alignment: titulo_config.alignment_titulo,
        style: titulo_config.style,
        bold: true,
        noWrap: titulo_config.noWrap,
        margin: titulo_config.margin_titulo ? titulo_config.margin_titulo : [0, 0, 0, 0],
      };
      if (titulo_config.fillColor) obj_titulo['fillColor'] = titulo_config.fillColor;

      titulos.push(obj_titulo as TablaRowPdfMake);
    } catch (error) {
      console.error(':::::::: error=> ', error);
    }
  });

  // if (contendio_.length > 0 || configuration.only_titulo) body.push(titulos as TablaRowPdfMake);
  body.push(titulos as TablaRowPdfMake);
  let longitud_cuerpo = 0;
  if (!configuration.only_titulo && Array.isArray(contendio_)) {
    contendio_.forEach((detalle, j) => {
      longitud_cuerpo += 1;
      const row = formarCuerpo(data, configuration, detalle, j);
      body.push(row as TablaRowPdfMake);
    });
  }

  var content = [
    configuration.only_titulo || (Array.isArray(contendio_) && contendio_.length > 0)
      ? ({
          table: {
            headerRows: 1,
            widths: configuration.widths,
            body: body,
          } as TablaBodyPdfMake,
          margin: configuration.margin_general,

          layout: {
            hLineWidth: function (i, node) {
              const brk = data.mostrar_sub_titulo ? configuration.break : configuration.break + 1;
              // const brk = configuration.break;

              if (configuration.isBreak) {
                return i % brk === 0 && node.table.body.length !== brk ? 0 : i === node.table.body.length || i === 1 ? 2 : 0.5;
              } else {
                return i == 0 ? 0 : 1 === 1 ? 1.5 : 1;
              }
            },
            vLineWidth: function (i, node) {
              return 0;
            },
            hLineColor: function (i, node) {
              if (configuration.isLineLight) {
                return i === node.table.body.length ? 'black' : i === 1 ? '#b5b5b5' : '#ebebeb';
              } else {
                return i === node.table.body.length || i === 1 ? 'black' : 'grey';
              }
            },
            vLineColor: function (i, node) {
              return 'black';
            },
          },
        } as TablaPdfMake)
      : { text: Array.isArray(contendio_) ? configuration.mensaje_contenido_vacio : '', margin: [0, 2, 0, 5] },

    configuration.mostrar_total && data.total >= 1
      ? {
          stack: [
            {
              margin: [0, 3, 14, 3],
              columns: [
                [],
                [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [
                          {
                            alignment: 'right',
                            text: [
                              {
                                text: 'TOTAL RD$:         ',
                                style: 'letra10',
                                bold: true,
                              },
                              {
                                text: fun_.numFormatTwoDecimals(data_.total),
                                style: 'letra10',
                                bold: true,
                              },
                            ],
                          },
                        ],
                      ],
                    },
                    layout: 'noBorders',
                  },
                ],
              ],
            },
          ],
          unbreakable: true,
        }
      : { text: '' },
  ];
  return content;
}

function formarCuerpo(data, configuration, detalle, j) {
  const row = [];

  const brk = data.mostrar_sub_titulo ? configuration.break - 1 : configuration.break;

  const br_ = j !== 0 && j % brk === 0;

  configuration.info.forEach((info, i) => {
    let obj = {};
    let text_ = '';

    if (info.key === 'index') {
      text_ = j + 1;
    } else {
      if (info.formato_fecha) {
        text_ = fun_.my_dateFormater(detalle[info.key]);
      } else if (info.formato_numero_tachado) {
        text_ = fun_.numFormatTwoDecimals(detalle[info.key], true);
      } else if (info.formato_numero) {
        text_ = fun_.numFormatTwoDecimals(detalle[info.key]);
      } else {
        text_ = detalle[info.key];
      }
    }
    obj = {
      text: text_,
      alignment: info.alignment_body,
      margin: info.margin_body ? info.margin_body : [0, 0, 0, 0],
      style: info.style_body,
      noWrap: info.noWrap,
      pageBreak: configuration.isBreak ? (br_ ? 'before' : 'none') : 'none',
    };

    if (info.fillColor) obj['fillColor'] = info.fillColor;

    row.push(obj);
  });

  return row;
}

export interface TablaBodyPdfMake {
  widths: Array<Number>;
  body: Array<Array<TablaRowPdfMake>>;
  headerRows: Number;
}

export interface TablaPdfMake {
  table: TablaBodyPdfMake;
  style?: String;
  margin?: Array<Number>;
  layout?: any;
}
export interface TablaRowPdfMake {
  text?: String;
  border?: Array<boolean>;
  style?: any;
  alignment?: String;
  fillColor?: String;
  alignment_titulo?: String;
  noWrap?: Boolean;
  style_body?: String;
  key?: String;
  alignment_body?: String;
  margin_titulo?: Array<Number>;
  margin_body?: Array<Number>;
}
