import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../new_modal/modal-class';
import { fun } from '../../../../core/services/functions.service';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  @Input() tipo = 'devuelta';
  @Input() data;
  @Input() debe_cubrir = true;

  element: any;
  devuelta = '0.00';
  efectivo: string;
  formaPago = 'Efectivo';
  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
  factura_de: any;
  cambiar_articulos = undefined;
  constructor() {
    super();
  }
  modal: any = {};
  inputs: any;

  ngOnInit() {
    this.data = this.inputs;

    this.efectivo = this.formatoNumero(this.data.devuelta);
    this.factura_de = this.data.factura_de;

    if (!this.data.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.factura_de != 'compra' && this.tipo == 'devuelta') this.enfocarInput('inputEfectivo');

      if (this.factura_de == 'compra' && !this.data.cambios_articulos) this.disableBtnConfirm(false);
    }, 250);
  }

  saltar(campo, valor?) {
    if (campo === 'formaPago') {
      this.enfocarInput(campo);
    }
    if (campo === 'send') {
      if (this.tipo !== 'no_devuelta' && this.efectivo < this.data.total_factura) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
        this.enfocarInput('inputEfectivo');
      } else {
        this.btn_aceptar();
      }
    }
  }

  formatoNumero(num) {
    return fun.numFormatTwoDecimals(num);
  }

  revisarPrecio(input) {
    fun.revisarPrecio(input, `inputEfectivo`).then((res) => {
      if (!res.error) input.value = res.number;
    });
  }

  calcularDevueta() {
    const total = this.data.total_factura;
    const efectivo = fun.desformatear(this.efectivo);
    const dev = efectivo - total;

    this.devuelta = this.formatoNumero(isNaN(dev) ? '0.00' : dev);
  }

  cancelar() {
    this.cancel.emit();
  }

  btn_aceptar() {
    const devuelta_ = fun.desformatear(this.devuelta);
    const efectivo = fun.desformatear(this.efectivo);
    const obj = { dinero: efectivo, devuelta: this.devuelta ? devuelta_ : 0, forma_pago: this.formaPago, decision_cambio: this.cambiar_articulos === 'si' ? true : false };

    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    if (this.factura_de == 'compra') {
      if (this.cambiar_articulos != undefined) {
        modal.getDataModal({ obj, modal_id: this.modal.component_id });
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
        modal.getDataModal({ obj, modal_id: this.modal.component_id });
      }
    }
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = this.data.total_factura;
    const efectivo = fun.desformatear(this.efectivo);

    const isInvalid = isNaN(efectivo) ? true : this.tipo != 'no_devuelta' && total > efectivo;

    if (from == 'input') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    const modal = _.find(this.modal.instance.modalsConfig, { id: this.modal.component_id });
    const btn = _.find(modal.botones.dinamico, { btn_id: 'btnConfirmar' });

    btn.disable = validate;
  }
}
