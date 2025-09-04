import { fun } from '@core/services/functions.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { FacturaC } from './factura';

export class PreFacturaClass extends MixinClass {
  facturaClass = new FacturaC();
  una_variable = '';
  constructor() {
    super();
  }

  parseFactura(factura, fact_de, buscarPara) {
    return new Promise<any>(resolve => {
      fun.setTimeout(() => {
        factura['FACTURA_DE'] = fact_de;
        resolve(factura);
      }, 5);
    });
  }
}
