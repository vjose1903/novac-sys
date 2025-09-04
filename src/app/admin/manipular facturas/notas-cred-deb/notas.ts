import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { CrudG } from '@core/typescript/crud-g';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
import { fun } from '@core/services/functions.service';
import { ReporteC } from '../../reportes/reporte';
import { csvConfig } from '@core/services/reports/excel/configs/report/notas';
import { serie, unidadAbrev } from '@core/typescript/constantes';
import Big from 'big.js';
import { ICallbackModal, modalCloseType } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalClass } from '@core/components/dynamic-modal/config/dynamic-modal.class';
import { DateUtils } from '@vjose1903/dateutils';

export enum comprobanteNormal {
  debito = '03',
  credito = '04',
}

export enum comprobanteElectronico {
  debito = '33',
  credito = '34',
}

export class NotaC extends CrudG<any> {
  constructor() {
    super('notas');
  }

  static tipo_nota = {
    credito: 'nota_credito',
    debito: 'nota_debito',
  };

  static base_comprobante = {
    normal: {
      nota_debito: comprobanteNormal.debito,
      nota_credito: comprobanteNormal.credito,
    },
    electronica: {
      nota_debito: comprobanteElectronico.debito,
      nota_credito: comprobanteElectronico.credito,
    },
    all: {
      nota_debito: `${comprobanteNormal.debito},${comprobanteElectronico.debito}`,
      nota_credito: `${comprobanteNormal.credito},${comprobanteElectronico.credito}`,
    },
  };

  parseDataToPdf(data) {
    return new Promise<any>(resolve => {
      const configApp = Ss.configServ.config;

      const pick_nota1 = ['cliente', 'estado', 'fecha_equivalente', 'fecha_valida', 'id', 'identificador', 'numero_comprobante', 'numero_documento', 'tipo_factura', 'total', 'bruto', 'itbis', 'usuario', 'facturas_aplicadas', 'tipo_factura_id'];
      const pick_nota2 = ['tipo_factura_id', 'razon', 'serie', 'qr_url_dgii', 'fecha_hora_firma', 'security_code', 'document_reference', 'is_ncf_modificado'];
      const pick_nota = [...pick_nota1, ...pick_nota2];

      let temp_data_parsed = fun.pick(fun.deepCloning(data), pick_nota);

      temp_data_parsed.ncf_modificado = temp_data_parsed.facturas_aplicadas[0]?.cabecera_factura?.numero_comprobante || '';

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [{ old_key: 'tipo_factura', new_key: 'tipo_pdf' }]);

      data_parsed.fecha = new Date(data_parsed.fecha_equivalente);
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();

      data_parsed.contenido_reporte = [];

      data_parsed.facturas_aplicadas.forEach(factura_aplicada => {
        if (data_parsed.serie == serie.normal) {
          data_parsed.contenido_reporte.push(this.parseContentAgrupadoNota(factura_aplicada));
        } else if (data_parsed.serie == serie.electronica) {
          let descuento = 0;
          data_parsed.contenido_reporte = factura_aplicada.detalles_facturas_notas.map(detalle => {
            detalle['cantidad_mostrar'] = `${fun.roundNumberToDecimal(detalle.cantidad)} ${unidadAbrev[fun.normalizarTexto(detalle.unidad)]}.`;

            const isPriceChange = detalle.cantidad == 0;
            const descuento_big = Big(detalle.descuento);
            const descuento_equivalente = descuento_big.div(detalle.cantidad_origin).toNumber();
            const descuento_proporcional = descuento_equivalente * (isPriceChange ? detalle.cantidad_origin : detalle.cantidad);

            detalle['descuento_valor'] = fun.desformatearStNumber(fun.roundNumberToDecimal(descuento_proporcional));

            descuento += detalle['descuento_valor'];

            return detalle;
          });

          data_parsed.descuento = descuento;
        }
      });

      resolve(data_parsed);
    });
  }

  parseContentAgrupadoNota(factura_aplicada) {
    factura_aplicada.fecha = DateUtils.format({ date: factura_aplicada.cabecera_factura.fecha_equivalente, dateFormat: 'DD/MM/YYYY' });
    factura_aplicada.numero_comprobante = factura_aplicada.cabecera_factura.numero_comprobante;
    factura_aplicada.total = fun.roundNumberToDecimal(Math.abs(factura_aplicada.total));
    delete factura_aplicada.cabecera_factura;
    delete factura_aplicada.detalles_facturas_notas;
    return factura_aplicada;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; titulo?: any }) {
    return new Promise<any>((resolve, reject) => {
      const { tipo, titulo } = params;
      const inputs = { tipo_reporte: tipo };

      ReporteC.objReporte = { inputs: inputs, id: tipo, header: titulo, callback: returnDataFromModal };

      function returnDataFromModal(arg: ICallbackModal) {
        if (arg.type != modalCloseType.returnData) return;
        NotaC.requestReporte(arg.data, params);
        resolve(arg.data);
      }

      new DynamicModalClass(ReporteC.objReporte).show();
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;
    const formReporte = reporteParams.data;

    requestParameters = {
      desde: DateUtils.format({ date: formReporte.desde, dateFormat: 'YYYY-MM-DD' }),
      hasta: DateUtils.format({ date: formReporte.hasta, dateFormat: 'YYYY-MM-DD' }),
      tipo_factura_id: formReporte.tipo,
    };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.configCsv = csvConfig;
    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then(response => {
      let objPdfView = { ...response, titulo: pdfParams.titulo, fileName: response.file.split('.')[0] };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
