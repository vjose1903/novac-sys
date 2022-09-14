import * as _ from 'lodash';
import { PdfService } from '../../core/services/pdf/pdf.service';
import { fun } from '../../core/services/functions.service';
import { MixinClass } from '../../core/typescript/MixinClass';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { FacturaC } from './factura';

export class PreFacturaClass extends MixinClass {
  pdfServ: PdfService;
  facturaClass = new FacturaC();
  constructor(pdfServ) {
    super();

    this.pdfServ = pdfServ;
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
      const res = await this.facturaClass.getAll({ afterPath: `custom/pre_factura/${numero}`, parameters: { tipo: 'single', paginado: false } });
      const pre_factura = res['data'];

      pre_factura.detalle_facturas = pre_factura.detalle_facturas.map((detalle) => {
        detalle.from_pre_factura = true;
        return detalle;
      });

      this.mostrarFactura(pre_factura);
      // fun.toastError('No existe Pre-factura con este número.', 'ERROR');
    } catch (error) {
      console.error(error);
    }
  }

  // =============================================
  //  MODAL PARA BUSCAR PRE FACTURA
  // =============================================

  mostrarFactura(dataFactura) {
    this.facturaClass.parseDataToPdf(dataFactura).then(async (factura_parsed) => {
      const toPDFData = { data: factura_parsed, type: 'facturacion' };

      this.pdfServ.generatePdf({ oPdf: toPDFData, imprimir: false }).then(async (res) => {
        if (res.status === 'si') {
          const inputs = { pdfSrc: res.body, height: '30rem', reimprimir: res.reimprimir, fileName: res.file.split('.')[0] };
          const obj_modal = {
            component: PdfViewerComponent,
            inputs: inputs,
            id: 'mostrarFactura',
            header: 'Pre-factura',
            width: '900px',
            botones: {
              aceptar: { show: false, disable: false },
              cancelar: { show: false, disable: false },
              dinamico: [
                { clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false },
                { clase: 'btn btn-verde ', function: (instance) => this.selectPreFactura(dataFactura, instance), label: 'Continuar', disable: false },
              ],
            },
          };

          this.handleModalForm(obj_modal);
        }
      });
    });
  }

  selectPreFactura(data, modalInstance) {}
}
