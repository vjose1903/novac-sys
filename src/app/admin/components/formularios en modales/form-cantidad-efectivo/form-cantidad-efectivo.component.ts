import { ConfigService } from './../../../../core/services/configuration.service';
import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener } from '@angular/core';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';
import { SharedService } from '../../../../core/services/shared.service';
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
      this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(ConfigService.config.documentos_a_imprimir);
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
      if (this.inputs.tipo_modal != 'no_devuelta' && this.efectivo < fun.desformatear(this.inputs.total_factura)) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
        fun.enfocarInput('inputEfectivo');
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
    if (fun.isEmpty(this.efectivo)) {
      this.devuelta = '0.00';
    } else {
      const total = fun.desformatear(this.inputs.total_factura);
      const efectivo = fun.desformatear(this.efectivo);

      const dev = efectivo - total;

      this.devuelta = efectivo == 0 ? '0.00' : this.formatoNumero(isNaN(dev) ? '0.00' : dev);
    }
  }

  cancelar() {
    this.cancel.emit();
  }

  btn_aceptar() {
    const devuelta_ = fun.desformatear(this.devuelta);
    const efectivo = fun.desformatear(this.efectivo);
    const obj = { dinero: efectivo, devuelta: this.devuelta ? devuelta_ : 0, forma_pago: this.formaPago, decision_cambio: this.cambiar_articulos === 'si' ? true : false };

    let dataToReturn;

    if (this.factura_de == 'compra') {
      if (this.cambiar_articulos != undefined) {
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modal.component_id };
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modal.component_id };
      }
    }

    this.modal.instance.resetConfig(this.modal.component_id, dataToReturn);
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = fun.desformatear(this.inputs.total_factura);
    const efectivo = fun.desformatear(this.efectivo);

    let isInvalid = isNaN(efectivo) ? true : this.inputs.tipo_modal != 'no_devuelta' && total > efectivo;

    if (this.factura_de == 'compra') isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    const modal = this.modal.instance.modalsConfig.find((modal) => modal.id == this.modal.component_id);
    const btn = modal.botones.dinamico.find((boton) => boton.btn_id == 'btnConfirmar');

    btn.disable = validate;
  }
}
