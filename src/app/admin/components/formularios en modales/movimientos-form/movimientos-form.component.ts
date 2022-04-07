import { Component, OnInit, Output, EventEmitter, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { fun } from '../../../../core/services/functions.service';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../new_modal/modal-class';
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
  modal: any = {};
  inputs: any;

  ngOnInit() {
    this.medidas = _.keys(this.inputs.cantidades);
  }
  ngAfterViewInit() {
    this.enfocarInput('tipo_movimiento');
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
      this.enfocarInput(campo);
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
    const obj = {
      articulo_id: this.inputs.id,
      cantidad: this.cantidad,
      accion: this.tipo_movimiento,
      motivo: this.motivo,
      medida: this.medida,
      tipo_salida: this.tipo_salida,
    };

    this.movimientosC.createOne(obj).then((res) => {
      fun.toastSuccess(_.capitalize(this.tipo_movimiento) + ' de inventario exitosa.', 'CORRECTO');
      this.resetForm();

      const obj = { bool: true, body: res.articulo };

      const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
      modal.closeModal('inventario', 'cancelar');
      modal.getDataModal({ data: obj, modal_id: this.modal.component_id });
    });
  }

  resetForm() {
    this.tipo_movimiento = undefined;
    this.medida = undefined;
    this.cantidad = undefined;
    this.motivo = undefined;
    this.enfocarInput('tipo_movimiento');
  }
}
