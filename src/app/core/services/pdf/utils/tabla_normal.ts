/* eslint-disable @typescript-eslint/indent */
import * as fun_ from './funciones';

export function getContentWithTablaNormal(configuration, data, index_data?, index_info?) {
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
      if (titulo_config.fillColorTituloCondition) {
        for (let i = 0; i < titulo_config.fillColorTituloCondition.length; i++) {
          const condicion = titulo_config.fillColorCondition[i];
          if (condicion.object == 'data' && data[condicion.key] == condicion.value) obj_titulo['fillColor'] = condicion.color;
        }
      }

      titulos.push(obj_titulo as TablaRowPdfMake);
    } catch (error) {
      console.error(':::::::: error=> ', error);
    }
  });

  body.push(titulos as TablaRowPdfMake);

  if (!configuration.only_titulo && Array.isArray(contendio_)) {
    contendio_.forEach((detalle, j) => {
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
            hLineWidth: (i, node) => {
              const brk = data.mostrar_sub_titulo ? configuration.break : configuration.break + 1;
              if (configuration.isBreak) {
                return i != 0 && i % brk == 0 && node.table.body.length != brk ? 0 : i == node.table.body.length || i == 0 || i == 1 ? 1 : 0.5;
              } else {
                return 1;
              }
            },
            vLineWidth: (i, node) => 0,
            hLineColor: (i, node) => {
              if (configuration.isLineLight) {
                return i == node.table.body.length ? 'black' : i == 1 ? '#b5b5b5' : '#ebebeb';
              } else {
                return i == node.table.body.length || i == 0 || i == 1 ? 'black' : 'grey';
              }
            },
            vLineColor: (i, node) => 'black',
          },
        } as TablaPdfMake)
      : { text: Array.isArray(contendio_) ? configuration.mensaje_contenido_vacio : '', margin: [0, 2, 0, 5] },

    Array.isArray(contendio_) && contendio_.length > 0 ? getTotalizacion(configuration, data_) : { text: '' },
  ];

  return content;
}

function getTotalizacion(configuration, data) {
  let totalizacion: any = {
    stack: [{ margin: [0, 3, 14, 3], columns: [[], [{ table: { widths: ['*', 'auto'], body: [] }, layout: 'noBorders' }]] }],
    unbreakable: true,
  };

  if ((data.total >= 0 && (data?.contenido_grupo?.length > 0 || data?.contenido_reporte?.length > 0)) || data.total >= 1) {
    const array = [
      { bool: configuration?.mostrar_bruto, title: 'BRUTO RD$ ', value: fun_.roundNumberToDecimal(data?.bruto) },
      { bool: configuration?.mostrar_descuento, title: 'DESCUENTO RD$ ', value: fun_.roundNumberToDecimal(data?.descuento) },
      { bool: configuration?.mostrar_itbis, title: 'ITBIS RD$ ', value: fun_.roundNumberToDecimal(data?.itbis) },
      { bool: configuration?.mostrar_bruto, title: 'DEVUELTO RD$ ', value: fun_.roundNumberToDecimal(data?.devuelto) },
      { bool: configuration?.mostrar_total, title: 'TOTAL RD$ ', value: fun_.roundNumberToDecimal(data?.total) },
    ];

    for (const item of array) {
      const molde = [
        { text: item.title, style: 'letra10', bold: true, alignment: 'right' },
        { text: item.value, style: 'letra10', bold: true, alignment: 'right' },
      ];

      if (item.bool) totalizacion.stack[0].columns[1][0].table.body.push(molde);
    }
  }

  if (!fun_.isEmpty(configuration?.customTotalizacion)) {
    for (const customTotal of configuration.customTotalizacion) {
      const molde = [
        { text: customTotal.title, style: 'letra10', bold: true, alignment: 'right' },
        { text: fun_.roundNumberToDecimal(data[customTotal.key]), style: 'letra10', bold: true, alignment: 'right' },
      ];
      totalizacion.stack[0].columns[1][0].table.body.push(molde);
    }
  }

  if (totalizacion.stack[0].columns[1][0].table.body.length == 0) totalizacion = { text: '' };

  return totalizacion;
}

function formarCuerpo(data, configuration, detalle, j) {
  const row = [];

  const brk = data.mostrar_sub_titulo ? configuration.break - 1 : configuration.break;

  const br_ = j != 0 && j % brk === 0;

  configuration.info.forEach((info, i) => {
    let obj = {};
    let text_ = '';
    const value = detalle[info.key];

    if (info.key === 'index') {
      text_ = j + 1;
    } else {
      if (info.formato_fecha) {
        text_ = fun_.my_dateFormater(value);
      } else if (info.formato_numero_tachado) {
        if (isNaN(Number(value))) text_ = value;
        else text_ = fun_.roundNumberToDecimal(value, true);
      } else if (info.formato_numero) {
        text_ = fun_.roundNumberToDecimal(value);
      } else {
        text_ = value;
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

    if (info.fillColorCondition) {
      for (let i = 0; i < info.fillColorCondition.length; i++) {
        const condicion = info.fillColorCondition[i];
        if (condicion.object == 'data' && detalle[condicion.key] == condicion.value) obj['fillColor'] = condicion.color;
      }
    }

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
