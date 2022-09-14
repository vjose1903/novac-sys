import { CrudG } from '../../../core/typescript/crud-g';
import * as _ from 'lodash';
import * as moment from '../../../core/javascript/moment';
import { fun } from '../../../core/services/functions.service';
import { DetalleNotaComponent } from '../detalle-nota/detalle-nota.component';

export class NotaC extends CrudG<any> {
  constructor() {
    super('notas');
  }

  parseDataToPdf(data) {
    return new Promise((resolve) => {
      const pick_nota = ['cliente', 'estado', 'fecha_equivalente', 'fecha_valida', 'id', 'identificador', 'numero_comprobante', 'numero_documento', 'tipo_factura', 'total', 'usuario', 'facturas_aplicadas', 'tipo_factura_id'];

      let temp_data_parsed = _.pick(fun.duplicarJson(data), pick_nota);

      const data_parsed = fun.remplaceKeyFromJson(temp_data_parsed, [
        { old_key: 'tipo_factura', new_key: 'tipo_pdf' },
        { old_key: 'facturas_aplicadas', new_key: 'contenido_reporte' },
      ]);

      data_parsed.fecha_equivalente = moment(data_parsed.fecha_equivalente);
      data_parsed.tipo_pdf = data_parsed.tipo_pdf.toUpperCase();

      data_parsed.contenido_reporte.map((factura_aplicada) => {
        factura_aplicada.fecha = moment(factura_aplicada.cabecera_factura.fecha_equivalente).format('DD/MM/YYYY');
        factura_aplicada.numero_comprobante = factura_aplicada.cabecera_factura.numero_comprobante;
        factura_aplicada.total = fun.numFormatTwoDecimals(Math.abs(factura_aplicada.total));
        delete factura_aplicada.cabecera_factura;
        delete factura_aplicada.detalles_facturas_notas;
        return factura_aplicada;
      });

      resolve(data_parsed);
    });
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
        aceptar: { show: false, disable: false },
        cancelar: { show: false, disable: false },
        dinamico: [{ clase: 'btn btn-blanco mr-2', function: (instance) => instance.closeModal(instance.id, 'cancelar'), label: 'Cerrar', disable: false }],
      },
    };
  }
}
