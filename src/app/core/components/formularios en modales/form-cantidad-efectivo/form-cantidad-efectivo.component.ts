<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
import { ConfigService } from './../../../../core/services/configuration.service';
import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { MixinClass } from '../../../../core/typescript/MixinClass';
import { ModalComponentI, ModalI } from '../../modal/modal-class';
import { fun } from '../../../../core/services/functions.service';
import { SharedService } from '../../../../core/services/shared.service';
import { teclasCode } from '../../../../core/typescript/constantes';
import { DocumentoDevuelta, TipoCantidadEfectivo } from './form-cantidad-efectivo.model';
import { HtmlElementsService } from '../../../../core/services/html-elements.service';
=======
import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject, Input } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { teclasCode } from '@core/typescript/constantes';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { tipoDocFacturacion } from '@admin/facturacion/factura';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
  standalone: false,
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, IDynamicModal {
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;
  }

  element: any;
  devuelta = '0.00';
  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();
<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
  documento: any;
=======
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts

  cambiar_articulos = undefined;
  is_print: boolean;
  documentos_a_imprimir = [];
  TipoCantidadEfectivo = TipoCantidadEfectivo;
  DocumentoDevuelta = DocumentoDevuelta;

  tipoDocFacturacion = tipoDocFacturacion;

  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;

  @Input() metodo!: tipoDocFacturacion;
  @Input() efectivo: string;
  @Input() total_factura: string;
  @Input() formaPago: string = 'Efectivo';
  @Input() cambios_articulos: string;
  @Input() condicion_fact: string;

  htmlServ = inject(HtmlElementsService);

  constructor(private shServ: SharedService) {
    super();
  }

<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
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
=======
  ngOnInit() {
    this.efectivo = fun.hasValue(this.efectivo) ? this.formatoNumero(this.efectivo) : '0.00';
    if (!this.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    fun.setTimeout(() => {
      this.configApp = Ss.configServ.config;
      this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
      this.handleDefaultSwitch();

      if (this.metodo != tipoDocFacturacion.compra) fun.enfocarInput('inputEfectivo');

      if (this.metodo == tipoDocFacturacion.compra && !this.cambios_articulos) this.disableBtnConfirm(false);
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
      this.validarForm('init');
      this.calcularDevueta();
    }, 250);
  }

  handleDefaultSwitch() {
<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
    if (this.documento == DocumentoDevuelta.venta) {
      const comparation = this.inputs.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.documento);
=======
    if (this.metodo == tipoDocFacturacion.venta) {
      const comparation = this.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.metodo);
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
    }
  }

  saltar(campo, valor?) {
    if (campo === 'inputFormaPago') {
      fun.enfocarInput(campo);
    }
    if (campo === 'send') {
<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
      if (this.inputs.tipo_modal != TipoCantidadEfectivo.noDevuelta && this.efectivo < fun.desformatearStNumber(this.inputs.total_factura)) {
=======
      if (parseFloat(fun.desformatearStNumber(this.efectivo)) < fun.desformatearStNumber(this.total_factura)) {
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
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
      const total = fun.desformatearStNumber(this.total_factura);
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

<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
    let dataToReturn;

    if (this.documento == DocumentoDevuelta.compra) {
      if (this.cambiar_articulos != undefined) {
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modalComponent.id };
=======
    if (this.metodo == tipoDocFacturacion.compra) {
      if (this.cambiar_articulos != undefined) {
        this.modalConfig.close({ obj, is_print: this.is_print, modal_id: this.modalConfig.id });
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
        dataToReturn = { obj, is_print: this.is_print, modalId: this.modalComponent.id };
=======
        this.modalConfig.close({ obj, is_print: this.is_print, modal_id: this.modalConfig.id });
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
      }
    }

    this.modalComponent.closeModal(this.modalComponent.id, dataToReturn);
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = fun.desformatearStNumber(this.total_factura);
    const efectivo = fun.desformatearStNumber(this.efectivo);

<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
    let isInvalid = isNaN(efectivo) ? true : this.inputs.tipo_modal != TipoCantidadEfectivo.noDevuelta && total > efectivo;

    if (this.documento == DocumentoDevuelta.compra) isInvalid = false;
=======
    let isInvalid = isNaN(efectivo) ? true : total > efectivo;

    if (this.metodo == tipoDocFacturacion.compra) isInvalid = false;
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
<<<<<<< HEAD:src/app/admin/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
    // TODO: revisar
    const modal = this.modalComponent.modalsConfig.find((modal) => modal.id == this.modalComponent.id);
    const btn = modal.botones.dinamico.find((boton) => boton.btnId == 'btnConfirmar');

    btn.disable = validate;
=======
    this.modalConfig.botones.find(btn => btn.id == 'btnConfirmar').disable = validate;
>>>>>>> dev:src/app/core/components/formularios en modales/form-cantidad-efectivo/form-cantidad-efectivo.component.ts
  }
}
