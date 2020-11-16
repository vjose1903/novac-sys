import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DBservice } from '../../../../core/services/bdservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { ValidateRayaAbajo } from '../../../../directives/validaciones';
import { GLOBAL } from '../../../../core/services/GLOBAL';
import { ModalService } from '../../modal/modal.service';
import { FunctionService } from '../../../../core/services/functions.service';

@Component({
  selector: 'app-movimientos-form',
  templateUrl: './movimientos-form.component.html',
  styleUrls: ['./movimientos-form.component.scss'],
})
export class MovimientosFormComponent implements OnInit, AfterViewInit {
  form;
  tipo_movimiento;
  tipo_salida;
  medida;
  element: any;
  cantidad = 0;
  motivo;
  @Input() data;
  @Output() cancel = new EventEmitter<any>();
  medidas;
  plural = { Quintal: 'Quintales', Libra: 'Libras', Caja: 'Cajas', Paquete: 'Paquetes', Unidad: 'Unidades', Saco: 'Sacos' };
  constructor(private dbServ: DBservice, private fun: FunctionService, private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private mServ: ModalService) {}

  ngOnInit() {
    this.medidas = _.keys(this.data.cantidades);
  }
  ngAfterViewInit() {
    this.enfocarInput('tipo_movimiento');
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
  enfocarInput(arg) {
    this.element = document.getElementById(arg) as HTMLElement;
    this.element.focus();
  }

  selectContenido(arg) {
    this.element = document.getElementById(arg);
    this.element.select();
  }

  saltar(campo) {
    if (campo !== 'send') {
      this.enfocarInput(campo);
    } else {
      this.submit();
    }
  }

  abilitarBtnSend() {
    let res = true;
    if (this.tipo_movimiento && this.medida && this.cantidad && this.motivo) {
      if (this.tipo_movimiento === 'salida') {
        res = false;
        if (!this.tipo_salida) {
          res = true;
        }
      } else {
        res = false;
      }
    } else {
      res = true;
    }

    return res;
  }

  selectTipoMov() {
    if (this.tipo_movimiento === 'entrada') {
      this.tipo_salida = undefined;
    }
  }
  submit() {
    const empleado = this.fun.getUser();

    const obj = {
      user_id: empleado.id,
      articulo_id: this.data.id,
      cantidad: this.cantidad,
      accion: this.tipo_movimiento,
      motivo: this.motivo,
      medida: this.medida,
      tipo_salida: this.tipo_salida,
    };
    this.dbServ.createMovimientoI(obj).subscribe(
      (res) => {
        this.dbServ.toastSuccess(_.capitalize(this.tipo_movimiento) + ' de inventario exitosa.', 'CORRECTO');
        this.resetForm();

        const obj = {
          bool: true,
          body: res.articulo,
        };
        this.accion(obj);
      },
      (err) => {
        console.error(err.error);
        this.mostrarErrores(err.error);
        // this.dbServ.toastError(err.error, 'Error', true);
      },
    );
  }
  mostrarErrores(arg) {
    for (const error in arg) {
      if (arg.hasOwnProperty(error)) {
        const element = arg[error];
        this.dbServ.toastError(element, 'Error', true);
      }
    }
  }
  resetForm() {
    this.tipo_movimiento = undefined;
    this.medida = undefined;
    this.cantidad = undefined;
    this.motivo = undefined;
    this.enfocarInput('tipo_movimiento');
  }
}
