import { FacturacionService } from './facturacion.service';
import * as _ from 'lodash';

import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { PdfViewerComponent } from '@components/pdf-viewer/pdf-viewer.component';
import { FacturaC } from './factura';
import { ModalClass } from '@components/modal/modal-class';
import { PdfService } from '@core/services/reports/pdf/pdf.service';

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

}
