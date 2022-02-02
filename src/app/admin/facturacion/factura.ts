import { CrudG, extraArgs } from '../../core/typescript/crud-g';
import * as _ from 'lodash';
export class FacturaC extends CrudG<any> {
  constructor() {
    super('cabecera_facturas');
  }

  getFacturaById(id: number) {
    return new Promise((resolve) => {
      this.getOne(id).then((res) => resolve(res));
    });
  }

  getFacturasByParams(args: { campo: string; valor: 'string'; tipo_factura_id: number; adelantada: boolean; page: number; per_page: number; paginado: boolean }) {
    // `params/${campo}/${VALOR_ENC}/${tipo_factura_id}/${adelantada}?page=${page}&per_page=${per_page}&paginado=${paginado}`

    const valor_enc = btoa(args.valor);
    const VALOR_ENC = _.replace(valor_enc, '\\', '&^IC');

    const extra = {
      afterPath: `params/${args.campo}/${VALOR_ENC}/${args.tipo_factura_id}/${args.adelantada}`,
      parameters: { page: args.page, per_page: args.per_page, paginado: args.paginado },
    };
    return this.getAll(extra);
    // return new Promise((resolve) => {
    //   this.getAll(extra).then((res) => resolve(res));
    // });
  }
}

export class TiposFacturaC extends CrudG<any> {
  constructor() {
    super('tipo_facturas');
  }
}
