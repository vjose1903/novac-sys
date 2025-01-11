import { inputViewerOptions } from './../../components/pdf-viewer/pdf-viewer';
import { ConfigI } from '../../../core/interface/config-interface';
import { Ss } from './../../../core/services/singleton.service';
import { CrudG } from '../../../core/typescript/crud-g';
import * as _ from 'lodash';
const moment = require('../../../core/javascript/moment');
import { fun } from '../../../core/services/functions.service';
import { DetalleNotaComponent } from '../detalle-nota/detalle-nota.component';
import { ModalClass } from '../../components/modal/modal-class';
import { ReporteC } from '../../reportes/reporte';

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
  };

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;

      const pick_nota = ['cliente', 'estado', 'fecha_equivalente', 'fecha_valida', 'id', 'identificador', 'numero_comprobante', 'numero_documento', 'tipo_factura', 'total', 'usuario', 'facturas_aplicadas', 'tipo_factura_id'];

      let temp_data_parsed = _.pick(fun.deepCloning(data), pick_nota);

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [{ old_key: 'tipo_factura', new_key: 'tipo_pdf' }]);

      data_parsed.fecha = moment(data_parsed.fecha_equivalente);
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();

      data_parsed.contenido_reporte = [];

      data_parsed.facturas_aplicadas.forEach((factura_aplicada) => {
        if (configApp.plantillas_impresion.nota == 'Agrupada') data_parsed.contenido_reporte.push(this.parseContentAgrupadoNota(factura_aplicada));

        if (configApp.plantillas_impresion.nota == 'Detallada') data_parsed.contenido_reporte.push(...this.parseContentDetalladoNota(factura_aplicada));
      });

      data_parsed.contenido_reporte.map((factura_aplicada) => {
        return factura_aplicada;
      });

      resolve(data_parsed);
    });
  }

  parseContentAgrupadoNota(factura_aplicada) {
    factura_aplicada.fecha = moment(`${factura_aplicada.cabecera_factura.fecha_equivalente}`).format('DD/MM/YYYY');
    factura_aplicada.numero_comprobante = factura_aplicada.cabecera_factura.numero_comprobante;
    factura_aplicada.total = fun.roundNumberToDecimal(Math.abs(factura_aplicada.total));
    delete factura_aplicada.cabecera_factura;
    delete factura_aplicada.detalles_facturas_notas;
    return factura_aplicada;
  }

  parseContentDetalladoNota(factura_aplicada) {
    const detalles = [];

    factura_aplicada.detalles_facturas_notas.forEach((detalle_nota) => {
      const obj_detalle = {};

      obj_detalle['fecha'] = moment(`${factura_aplicada.cabecera_factura.fecha_equivalente}`).format('DD/MM/YYYY');
      obj_detalle['numero_comprobante'] = factura_aplicada.cabecera_factura.numero_comprobante;
      obj_detalle['total'] = fun.roundNumberToDecimal(Math.abs(detalle_nota.total));
      obj_detalle['articulo'] = detalle_nota.articulo.nombre;

      detalles.push(obj_detalle);
    });

    return detalles;
  }

  modalVerDetalles(data) {
    return {
      component: DetalleNotaComponent,
      inputs: { data: data },
      id: `detalle_nota`,
      header: 'Detalles Notas',
      width: '60rem',
      height: '30rem',
      botones: {
        ...fun.deepCloning(ModalClass.noShowAceptarCancelarButtons),
        dinamico: [{ clase: 'btn btn-blanco', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
      },
    };
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  static openModalReporteForm(params: { tipo: any; inputs: any; openNewModal }) {
    return new Promise<any>((resolve, reject) => {
      ReporteC.objReporte = { inputs: params.inputs, id: params.tipo, header: params.inputs.titulo, returnDataFromModal: returnDataFromModal };

      params.openNewModal(ReporteC.objReporte);

      function returnDataFromModal(arg) {
        NotaC.requestReporte(arg, params);
        resolve(arg);
      }
    });
  }

  static requestReporte(reporteParams, pdfParams) {
    let requestParameters;

    requestParameters = { desde: fun.my_dateFormater(reporteParams.data.desde, false), hasta: fun.my_dateFormater(reporteParams.data.hasta, false), tipo_factura_id: reporteParams.data.tipo };

    const requestParams = { afterPath: `custom/${pdfParams.tipo}`, parameters: requestParameters };

    ReporteC.requestReporteAndMakePdf(requestParams, 'reporte').then((response) => {
      let objPdfView = { ...response, titulo: pdfParams.inputs.titulo, fileName: _.first(response.file.split('.')), openNewModal: pdfParams.openNewModal };

      ReporteC.visualizarReporte(objPdfView);
    });
  }
}
