import { Component, OnInit, Output, EventEmitter, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { fun } from '../../../../core/services/functions.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { IModalConfiguration, ModalComponentI, ModalI } from '../../modal/modal-class';
import { MovimientosC } from './movimiento-model';

@Component({
  selector: 'app-movimientos-form',
  templateUrl: './movimientos-form.component.html',
  styleUrls: ['./movimientos-form.component.scss'],
})
export class MovimientosFormComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  form;
  tipo_movimiento;
  tipo_salida;
  medida;
  element: any;
  cantidad = 0;
  motivo;
  // @Input() data;
  @Output() cancel = new EventEmitter<any>();
  medidas;

  movimientosC = new MovimientosC();
  plural = { Quintal: 'Quintales', Libra: 'Libras', Caja: 'Cajas', Paquete: 'Paquetes', Unidad: 'Unidades', Saco: 'Sacos' };
  constructor() {
    super();
  }
  modalComponent: ModalComponentI= {};
  inputs: any;

  ngOnInit() {
    this.medidas = _.keys(this.inputs.cantidades);
  }
  ngAfterViewInit() {
    fun.enfocarInput('tipo_movimiento');
  }

  formatoNumero(arg) {
    return fun.numFormatTwoDecimals(arg);
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
        const existenciaPorMedida = this.inputs.cantidades[this.medida];
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

  saltar(campo) {
    if (campo !== 'send') {
      fun.enfocarInput(campo);
    } else {
      this.btn_aceptar();
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

  btn_aceptar() {
    const obj = { articulo_id: this.inputs.id, cantidad: this.cantidad, cantidad_en_unidades: this.inputs.contenido[this.medida] * this.cantidad, accion: this.tipo_movimiento, motivo: this.motivo, medida: this.medida, tipo_salida: this.tipo_salida };

    this.movimientosC.createOne(obj).then((res) => {
      fun.toastSuccess(fun.capitalice(this.tipo_movimiento) + ' de inventario exitosa.', 'CORRECTO');
      this.resetForm();

      const obj = { bool: true, body: res.articulo };
      this.modalComponent.closeModal(this.modalComponent.id, { data: obj, modalId: this.modalComponent.id });
    });
  }

  resetForm() {
    this.tipo_movimiento = undefined;
    this.medida = undefined;
    this.cantidad = undefined;
    this.motivo = undefined;
    fun.enfocarInput('tipo_movimiento');
  }
}
