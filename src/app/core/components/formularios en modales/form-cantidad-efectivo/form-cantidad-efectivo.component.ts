import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject, Input, ViewChild } from '@angular/core';
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
import { DivisaService } from '@admin/registros/divisa/divisa.service';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
  standalone: false,
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, IDynamicModal {
  @ViewChild('formaPagoInput') formaPagoInput: any;

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;
  }

  element: any;
  devuelta = '0.00';
  isLoaded = false;
  private hasUserTyped = false;
  @Output() getDevuelta = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<any>();

  cambiar_articulos = undefined;
  is_print: boolean;
  documentos_a_imprimir = [];
  configApp: ConfigI;

  tipoDocFacturacion = tipoDocFacturacion;
  divisaPrincipalSimbolo = 'RD$';

  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;

  @Input() metodo!: tipoDocFacturacion;
  @Input() efectivo: string;
  @Input() total_factura: string;
  @Input() formaPago: string = 'Efectivo';
  @Input() cambios_articulos: string;
  @Input() condicion_fact: string;

  htmlServ = inject(HtmlElementsService);
  divisaServ = inject(DivisaService);

  constructor(private shServ: SharedService) {
    super();
  }

  ngOnInit() {
    this.efectivo = fun.hasValue(this.efectivo) ? this.formatoNumero(this.efectivo) : '0.00';
    if (!this.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    Promise.all([
      this.cargarDivisaPrincipal(),
      this.cargarConfig(),
    ]).then(() => {
      this.isLoaded = true;

      requestAnimationFrame(() => {
        if (this.metodo != tipoDocFacturacion.compra) fun.enfocarInput('inputEfectivo');
      });
    });
  }

  private cargarConfig(): Promise<void> {
    return new Promise(resolve => {
      fun.setTimeout(() => {
        this.configApp = Ss.configServ.config;
        this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
        this.handleDefaultSwitch();

        if (this.metodo == tipoDocFacturacion.compra && !this.cambios_articulos) this.disableBtnConfirm(false);
        this.validarForm('init');
        this.calcularDevueta();
        resolve();
      }, 250);
    });
  }

  handleDefaultSwitch() {
    if (this.metodo == tipoDocFacturacion.venta) {
      const comparation = this.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.metodo);
    }
  }

  async cargarDivisaPrincipal() {
    try {
      const divisas = await this.divisaServ.ensureDivisas({ skipLoader: true });
      this.setDivisaPrincipal(divisas);
    } catch (error) {
      this.setDivisaPrincipal();
    }
  }

  setDivisaPrincipal(divisas = this.divisaServ.listaDivisas) {
    const divisaPrincipal = divisas?.find(divisa => divisa.is_principal) || this.divisaServ.getDivisaPrincipalInfo();
    this.divisaPrincipalSimbolo = divisaPrincipal?.simbolo || 'RD$';
  }

  focusInputEfectivo() {
    fun.enfocarInput('inputEfectivo');
  }

  focusFormaPago(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.validarForm()) {
      fun.toastWarning('Efectivo no cubre el total del documento', 'AVISO');
      return;
    }

    (event?.target as HTMLElement | null)?.blur();
    this.focusPrimeSelect(this.formaPagoInput);
  }

  handleFormaPagoEnter(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.validarForm()) {
      fun.toastWarning('Efectivo no cubre el total del documento', 'AVISO');
      this.closePrimeSelect(this.formaPagoInput);
      fun.enfocarInput('inputEfectivo');
      return;
    }

    this.closePrimeSelect(this.formaPagoInput);
    this.focusConfirmButton();
  }

  focusConfirmButton() {
    fun.setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.dynamic-modal-button[data-modal-button-id="btnConfirmar"]'));
      const button = buttons.find(btn => btn.dataset['modalId'] === this.modalConfig.id && !btn.disabled) ?? buttons.find(btn => !btn.disabled);
      button?.focus({ preventScroll: true });
    }, 30);
  }

  private focusPrimeSelect(selectComponent: any): void {
    fun.setTimeout(() => {
      requestAnimationFrame(() => {
        const combobox = document.getElementById('formaPago') as HTMLElement | null;

        if (!selectComponent || selectComponent.$disabled?.()) {
          combobox?.focus({ preventScroll: true });
          return;
        }

        const focusInput = selectComponent.focusInputViewChild?.nativeElement as HTMLElement | undefined;
        const selectedIndex = selectComponent.findSelectedOptionIndex?.();
        const firstIndex = selectComponent.findFirstOptionIndex?.();
        const optionIndex = selectedIndex !== -1 ? selectedIndex : (firstIndex ?? 0);

        selectComponent.show?.(true);
        selectComponent.focusedOptionIndex?.set?.(optionIndex);
        selectComponent.scrollInView?.();
        (focusInput ?? combobox)?.focus({ preventScroll: true });
      });
    }, 30);
  }

  private closePrimeSelect(selectComponent: any): void {
    if (!selectComponent) return;

    const close = () => {
      selectComponent.hide?.();
      const focusInput = selectComponent.focusInputViewChild?.nativeElement as HTMLElement | undefined;

      focusInput?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    };

    close();
    requestAnimationFrame(close);
  }

  saltar(campo, valor?) {
    if (campo === 'formaPago') {
      this.focusFormaPago();
    }
    if (campo === 'send') {
      if (parseFloat(fun.desformatearStNumber(this.efectivo)) < fun.desformatearStNumber(this.total_factura)) {
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

  onEfectivoInput() {
    this.hasUserTyped = true;
  }

  onEfectivoBlur(input) {
    if (!this.hasUserTyped) return;

    fun.revisarNumber(input, `inputEfectivo`).then(res => {
      if (!res.error) input.value = res.number;

      if (this.validarForm()) {
        fun.toastWarning('Efectivo no cubre el total del documento', 'AVISO');
        fun.enfocarInput('inputEfectivo');
      }
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

    let isInvalid = isNaN(efectivo) ? true : total > efectivo;

    if (this.metodo == tipoDocFacturacion.compra) isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    this.modalConfig.botones.find(btn => btn.id == 'btnConfirmar').disable = validate;
  }
}
