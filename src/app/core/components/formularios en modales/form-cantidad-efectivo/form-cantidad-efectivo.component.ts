import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject, Input } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { fun } from '@core/services/functions.service';
import { SharedService } from '@core/services/shared.service';
import { teclasCode } from '@core/typescript/constantes';
import { DocumentoDevuelta, TipoCantidadEfectivo } from './form-cantidad-efectivo.model';
import { HtmlElementsService } from '@core/services/html-elements.service';
import { ConfigI } from '@core/interface/config-interface';
import { Ss } from '@core/services/singleton.service';
import { tipoDocFacturacion } from '@admin/facturacion/factura';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

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

  cambiar_articulos = undefined;
  is_print: boolean;
  documentos_a_imprimir = [];
  configApp: ConfigI;

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
  @Input() tipo_modal: TipoCantidadEfectivo;

  htmlServ = inject(HtmlElementsService);

  constructor(private shServ: SharedService) {
    super();
  }

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
      this.validarForm('init');
      this.calcularDevueta();
    }, 250);
  }

  handleDefaultSwitch() {
    if (this.metodo == tipoDocFacturacion.venta) {
      const comparation = this.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.metodo);
    }
  }

  saltar(campo, valor?) {
    if (campo === 'send') {
      if (this.tipo_modal != TipoCantidadEfectivo.noDevuelta && parseFloat(fun.desformatearStNumber(this.efectivo)) < fun.desformatearStNumber(this.total_factura)) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
        fun.enfocarInput('inputEfectivo');
      } else {
        this.btn_aceptar();
      }
    } else {
      fun.enfocarInput(campo);
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

    if (this.metodo == tipoDocFacturacion.compra) {
      if (this.cambiar_articulos != undefined) {
        this.modalConfig.close({ obj, is_print: this.is_print, modal_id: this.modalConfig.id });
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError('Efectivo no cubre el total de la factura', 'ERROR');
      } else {
        this.modalConfig.close({ obj, is_print: this.is_print, modal_id: this.modalConfig.id });
      }
    }
  }

  cambiosEnArticulos(lugar) {
    this.cambiar_articulos = lugar;
    this.disableBtnConfirm(false);
  }

  validarForm(from?): boolean {
    const total = fun.desformatearStNumber(this.total_factura);
    const efectivo = fun.desformatearStNumber(this.efectivo);

    let isInvalid = isNaN(efectivo) ? true : this.tipo_modal != TipoCantidadEfectivo.noDevuelta && total > efectivo;

    if (this.metodo == tipoDocFacturacion.compra) isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    this.modalConfig.botones.find(btn => btn.id == 'btnConfirmar').disable = validate;
  }
}
