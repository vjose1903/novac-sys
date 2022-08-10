import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter, HostListener } from '@angular/core';
import { GLOBAL } from '../../../../core/typescript/GLOBAL';
import * as _ from 'lodash';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';
import { SharedService } from '../../../../core/services/shared.service';
import { ConfigI } from '../../../../core/typescript/config-interface';
import { SingletonService } from '../../../../core/services/singleton.service';
import { teclasCode } from '../../../../core/typescript/constantes';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, ModalI {
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;
  }

  element: any;
  devuelta = '0.00';
  efectivo: string;
  formaPago = 'Efectivo';
  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
  factura_de: any;

  cambiar_articulos = undefined;
  is_print: boolean;
  documentos_a_imprimir = [];
  configApp: ConfigI;

  constructor(private shServ: SharedService) {
    super();
  }

  modal: any = {};
  inputs: any;

  ngOnInit() {
    this.efectivo = fun.hasValue(this.inputs.efectivo) ? this.formatoNumero(this.inputs.efectivo) : '0.00';
    this.factura_de = this.inputs.factura_de;
    this.formaPago = this.inputs.formaPago;

    if (!this.inputs.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.configApp = SingletonService.configServ.getConfig({ isPromise: false }) as ConfigI;
      this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
      this.handleDefaultSwitch();

      if (this.factura_de != 'compra') this.enfocarInput('inputEfectivo');

      if (this.factura_de == 'compra' && !this.inputs.cambios_articulos) this.disableBtnConfirm(false);
      this.validarForm('init');
      this.calcularDevueta();
    }, 250);
  }

  handleDefaultSwitch() {
    if (this.factura_de == 'venta') {
      const comparation = this.inputs.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.factura_de);
    }
  }

  saltar(campo, valor?) {
    if (campo === 'formaPago') {
      this.enfocarInput(campo);
    }
    if (campo === 'send') {
      if (this.inputs.tipo_modal != 'no_devuelta' && this.efectivo < this.inputs.total_factura) {
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
    const total = this.inputs.total_factura;
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
        modal.returnDataFromModal({ obj, is_print: this.is_print, modal_id: this.modal.component_id });
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
        modal.returnDataFromModal({ obj, is_print: this.is_print, modal_id: this.modal.component_id });
      }
    }
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = this.inputs.total_factura;
    const efectivo = fun.desformatear(this.efectivo);

    let isInvalid = isNaN(efectivo) ? true : this.inputs.tipo_modal != 'no_devuelta' && total > efectivo;

    if (this.factura_de == 'compra') isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    const modal = _.find(this.modal.instance.modalsConfig, { id: this.modal.component_id });
    const btn = _.find(modal.botones.dinamico, { btn_id: 'btnConfirmar' });

    btn.disable = validate;
  }
}
