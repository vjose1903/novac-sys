import { fun } from '@core/services/functions.service';
import { CrudG } from '@core/typescript/crud-g';
import { unidadAbrev } from '@core/typescript/constantes';

export class ConduceC extends CrudG<any> {
  constructor() {
    super('cabecera_conduces');
  }

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const data_parsed = fun.remplaceKeyFromJson(data, [
        { old_key: 'numero_conduce', new_key: 'identificador' },
        { old_key: 'detalle_conduces', new_key: 'contenido_reporte' },
      ]);

      data_parsed['tipo_pdf'] = 'CONDUCE DE MERCANCIA';
      data_parsed['numero_documento'] = data_parsed['identificador'];
      data_parsed['usuario'] = data.user.nombre_completo;

      const documento = data.cliente.documentos_de_identidad.find((documento) => documento.principal);
      data_parsed['cliente']['rnc'] = documento ? documento.documento : '----------';

      data_parsed['contenido_reporte'].map((detalle) => {
        detalle['cantidad'] = `${fun.roundNumberToDecimal(detalle.cantidad)} ${unidadAbrev[fun.normalizarTexto(detalle.unidad)]}.`;
      });

      resolve(data_parsed);
    });
  }
}
