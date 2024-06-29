import { ConfigService } from './../../../../core/services/configuration.service';
import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';
import { SharedService } from '../../../../core/services/shared.service';
import { teclasCode } from '../../../../core/typescript/constantes';
import { DocumentoDevuelta, TipoCantidadEfectivo } from './form-cantidad-efectivo.model';
import { HtmlElementsService } from '../../../../core/services/html-elements.service';

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
  documento: any;

  cambiar_articulos = undefined;
  is_print: boolean;
  documentos_a_imprimir = [];
  TipoCantidadEfectivo = TipoCantidadEfectivo;
  DocumentoDevuelta = DocumentoDevuelta;

  constructor(private shServ: SharedService) {
    super();
  }

  modalComponent: ModalComponentI = {};
  inputs: any;

  htmlServ = inject(HtmlElementsService);

  ngOnInit() {
    this.efectivo = fun.hasValue(this.inputs.efectivo) ? this.formatoNumero(this.inputs.efectivo) : '0.00';
    this.documento = this.inputs.documento;
    this.formaPago = this.inputs.formaPago;

    if (!this.inputs.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(ConfigService.config.documentos_a_imprimir);
      this.handleDefaultSwitch();

      if (this.documento != DocumentoDevuelta.compra) fun.enfocarInput('inputEfectivo');
      if (this.documento == DocumentoDevuelta.pagoFactura) fun.enfocarInput('inputFormaPago');

      if (this.documento == DocumentoDevuelta.compra && !this.inputs.cambios_articulos) this.disableBtnConfirm(false);
      this.validarForm('init');
      this.calcularDevueta();
    }, 250);
  }

  handleDefaultSwitch() {
    if (this.documento == DocumentoDevuelta.venta) {
      const comparation = this.inputs.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.documento);
    }
  }

  saltar(campo, valor?) {
    if (campo === 'inputFormaPago') {
      fun.enfocarInput(campo);
    }
    if (campo === 'send') {
      if (this.inputs.tipo_modal != TipoCantidadEfectivo.noDevuelta && this.efectivo < fun.desformatearStNumber(this.inputs.total_factura)) {
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
    fun.revisarNumber(input, `inputEfectivo`).then((res) => {
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

    let dataToReturn;

    if (this.documento == DocumentoDevuelta.compra) {
      if (this.cambiar_articulos != undefined) {
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modalComponent.id };
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modalComponent.id };
      }
    }

    this.modalComponent.closeModal(this.modalComponent.id, dataToReturn);
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = fun.desformatearStNumber(this.inputs.total_factura);
    const efectivo = fun.desformatearStNumber(this.efectivo);

    let isInvalid = isNaN(efectivo) ? true : this.inputs.tipo_modal != TipoCantidadEfectivo.noDevuelta && total > efectivo;

    if (this.documento == DocumentoDevuelta.compra) isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    // TODO: revisar
    const modal = this.modalComponent.modalsConfig.find((modal) => modal.id == this.modalComponent.id);
    const btn = modal.botones.dinamico.find((boton) => boton.btnId == 'btnConfirmar');

    btn.disable = validate;
  }
}
