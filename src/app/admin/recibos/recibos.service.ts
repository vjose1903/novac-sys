import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { MixinClass } from '../../core/typescript/MixinClass';
import { ModalHistorialPagosComponent } from '../components/formularios en modales/modal-historial-pagos/modal-historial-pagos.component';
import { ModalI } from '../components/new_modal/modal-class';
@Injectable({
  providedIn: 'root',
})
export class RecibosService extends MixinClass {
  constructor() {
    super();
  }

  abrirModalHistorial(pagos, notas) {
    if (pagos.length > 0 || notas.length > 0) {
      for (let i = 0; i < pagos.length; i++) {
        const pago = pagos[i];
        pago.numero_recibo = _.padStart(pago.numero_recibo, 8, '0');
        pago.fecha_equivalente = moment(pago.fecha_equivalente).format('DD/MM/YYYY');
      }

      for (let i = 0; i < notas.length; i++) {
        const nota = notas[i];
        nota.total_factura = Math.abs(nota.total_factura);
        nota.fecha_equivalente = moment(nota.fecha_equivalente).format('DD/MM/YYYY');
      }
    
      const obj = { abonos: pagos, notas: notas };
      this.handleModalForm({
        component: ModalHistorialPagosComponent,
        inputs: obj,
        id: 'historial_pago',
        header: 'Historial de moviemientos a balance de factura',
        width: '700px',
        height: '400px',
        botones: {
          aceptar: { show: false, disable: false },
          cancelar: { show: false, disable: false },
        },
      });
    }
  }
}
