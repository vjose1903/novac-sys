import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { teclasCode } from '@core/typescript/constantes';
import { HtmlElementsService } from '@core/services/html-elements.service';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
  standalone: false,
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

  htmlServ = inject(HtmlElementsService);

  ngOnInit() {
    this.efectivo = fun.hasValue(this.inputs.efectivo) ? this.formatoNumero(this.inputs.efectivo) : '0.00';
    this.factura_de = this.inputs.factura_de;
    this.formaPago = this.inputs.formaPago;

    if (!this.inputs.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.configApp = Ss.configServ.getConfig({ isPromise: false }) as ConfigI;
      this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
      this.handleDefaultSwitch();

      if (this.factura_de != 'compra') fun.enfocarInput('inputEfectivo');

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
      fun.enfocarInput(campo);
    }
    if (campo === 'send') {
      if (this.inputs.tipo_modal != 'no_devuelta' && parseFloat(fun.desformatearStNumber(this.efectivo)) < fun.desformatearStNumber(this.inputs.total_factura)) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
        fun.enfocarInput('inputEfectivo');
      } else {
        this.btn_aceptar();
      }
    }
  }

  formatoNumero(num) {
    return fun.roundNumberToDecimal(num);
  }

  revisarPrecio(input) {
    fun.revisarNumber(input, `inputEfectivo`).then(res => {
      if (!res.error) input.value = res.number;
    });
  }

  calcularDevueta() {
    if (fun.isEmpty(this.efectivo)) {
      this.devuelta = '0.00';
    } else {
      const total = fun.desformatearStNumber(this.inputs.total_factura);
      const efectivo = fun.desformatearStNumber(this.efectivo);

      const dev = efectivo - total;

      this.devuelta = efectivo == 0 ? '0.00' : this.formatoNumero(isNaN(dev) ? '0.00' : dev);
    }
  }

  cancelar() {
    this.cancel.emit();
  }

  btn_aceptar() {
    const devuelta_ = fun.desformatearStNumber(this.devuelta);
    const efectivo = fun.desformatearStNumber(this.efectivo);
    const obj = { dinero: efectivo, devuelta: this.devuelta ? devuelta_ : 0, forma_pago: this.formaPago, decision_cambio: this.cambiar_articulos === 'si' ? true : false };

    const modal = this.modal.instance.modalsConfig.find(config => config.id === this.modal.component_id);
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
    const total = fun.desformatearStNumber(this.inputs.total_factura);
    const efectivo = fun.desformatearStNumber(this.efectivo);

    let isInvalid = isNaN(efectivo) ? true : this.inputs.tipo_modal != 'no_devuelta' && total > efectivo;

    if (this.factura_de == 'compra') isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    const modal = this.modal.instance.modalsConfig.find(modal => modal.id == this.modal.component_id);
    const btn = modal.botones.dinamico.find(boton => boton.btn_id == 'btnConfirmar');

    btn.disable = validate;
  }
}
