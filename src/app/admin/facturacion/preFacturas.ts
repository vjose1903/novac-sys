import * as _ from 'lodash';

import { fun } from '../../core/services/functions.service';
import { MixinClass } from '../../core/typescript/MixinClass';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { FacturaC } from './factura';
import { ModalClass } from '../components/modal/modal-class';
import { PdfService } from '../../core/services/pdf/pdf.service';

export class PreFacturaClass extends MixinClass {
  facturaClass = new FacturaC();
  constructor() {
    super();
  }

  parseFactura(factura, fact_de, buscarPara) {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        factura['FACTURA_DE'] = fact_de;
        resolve(factura);
      }, 5);
    });
  }

  async buscarPreFactura(numero) {
    try {
      const result = { data: null, error: false };
      const res = await this.facturaClass.getAll({ afterPath: `custom/pre_factura/${numero}`, parameters: { tipo: 'single', paginado: false } });
      const pre_factura = res['data'];

      pre_factura.detalle_facturas = pre_factura.detalle_facturas.map((detalle) => {
        detalle.from_pre_factura = true;
        return detalle;
      });

      result.error = pre_factura && fun.hasValue(pre_factura.fecha_completada);
      result.data = pre_factura;
      return result;
    } catch (error) {
      console.error(error);
    }
  }

  // =============================================
  //  MODAL PARA BUSCAR PRE FACTURA
  // =============================================

  mostrarPreFactura(dataFactura) {
    this.facturaClass.parseDataToPdf(dataFactura).then(async (factura_parsed) => {
      const toPDFData = { data: factura_parsed, type: 'facturacion' };

      PdfService.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
        if (res.status === 'si') {
          const inputs = { base64: res.base64, height: '30rem', reimprimir: res.reimprimir, fileName: _.first(res.file.split('.')) };
          const obj_modal = {
            component: PdfViewerComponent,
            inputs: inputs,
            id: 'mostrarPreFactura',
            header: 'Pre-factura',
            width: '900px',
            botones: {
              ...ModalClass.noShowAceptarCancelarButtons,
              dinamico: [
                { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false },
                { clase: 'btn btn-verde ', function: (instance) => this.selectPreFactura(dataFactura, instance), label: 'Continuar', disable: false },
              ],
            },
          };

          this.configureNewModal(obj_modal);
        }
      });
    });
  }

  selectPreFactura(data, modalInstance) {}
}
