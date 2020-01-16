import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ObservableServcie } from '../../../core/services/observables.service';
import { DBservice } from '../../../core/services/bdservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ValidateRayaAbajo } from '../../../directives/validaciones';
import { ModalService } from '../../../components/modal/modal.service';
import { GLOBAL } from '../../../core/services/GLOBAL';

@Component({
  selector: 'app-movimientos-form',
  templateUrl: './movimientos-form.component.html',
  styleUrls: ['./movimientos-form.component.scss'],
})
export class MovimientosFormComponent implements OnInit {
  form;
  tipo_movimiento;
  medida;
  cantidad = 0;
  motivo;
  @Input() data;
  @Output() cancel = new EventEmitter<any>();
  medidas;
  plural = { Quintal: 'Quintales', Libra: 'Libras', Caja: 'Cajas', Paquete: 'Paquetes', Unidad: 'Unidades' };
  constructor(private artServ: ObservableServcie, private dbServ: DBservice, private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.medidas = _.keys(this.data.contenido);
  }
  accion(arg) {
    this.cancel.emit(arg);
  }
  formatoNumero(arg) {
    return GLOBAL.formatearNumero(GLOBAL.redondearAdos(arg));
  }

  mostrarExistencia(arg) {
    if (this.cantidad && this.medida) {
      const med = this.cantidad === 1 ? this.medida : this.plural[this.medida];
      if (arg === 'mov') {
        if (this.tipo_movimiento === 'entrada') {
          return 'Aumentará ' + this.cantidad + ' ' + med;
        } else if (this.tipo_movimiento === 'salida') {
          return 'Disminuirá ' + this.cantidad + ' ' + med;
        }
      } else {
        const existenciaPorMedida = this.data.cantidades[this.medida];
        let calculo = 0;
        if (this.tipo_movimiento === 'entrada') {
          calculo = existenciaPorMedida + this.cantidad;
        } else {
          calculo = existenciaPorMedida - this.cantidad;
        }
        return 'Proximo en inventario ' + this.formatoNumero(calculo) + ' ' + med;
      }
    }
  }
  submit() {}
}
