import { Component, OnInit, AfterViewInit, Output, EventEmitter, HostListener, inject, Input, QueryList, ViewChildren } from '@angular/core';
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
  @ViewChildren('formaPagoInput') formaPagoInputs!: QueryList<any>;

  readonly opcionesDeFormaPago = [
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Tarjeta', value: 'Tarjeta' },
    { label: 'Transferencia Bancaria', value: 'Transferencia' },
    { label: 'Cheque', value: 'Cheque' },
  ];
  readonly maximosMetodosDePago = 4;

  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;
  }

  @HostListener('window:keydown', ['$event'])
  handleMetodoPagoShortcut(event: KeyboardEvent) {
    if (this.metodo == tipoDocFacturacion.compra || !this.isLoaded || event.ctrlKey || event.metaKey || event.altKey) return;

    const agregar = event.key === '+' || event.code === 'NumpadAdd' || (event.code === 'Equal' && event.shiftKey) || event.keyCode === 107;
    const eliminar = event.key === '-' || event.code === 'NumpadSubtract' || event.code === 'Minus' || event.keyCode === 109;
    if (!agregar && !eliminar) return;

    event.preventDefault();
    event.stopPropagation();

    const focoActivoId = (document.activeElement as HTMLElement | null)?.id;
    if (agregar) this.agregarMetodoPago();
    if (eliminar) this.eliminarMetodoPago(this.metodosDePago.length - 1);
    this.restaurarFoco(focoActivoId);
  }

  @HostListener('window:keydown', ['$event'])
  blockEnterWhileLoading(event: KeyboardEvent) {
    if (!this.isLoaded && event.key === 'Enter') {
      this.pendingInitialEnter = true;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  element: any;
  devuelta = '0.00';
  isLoaded = false;
  private pendingInitialEnter = false;
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
  @Input() metodosDePago: Array<{ forma_pago: string; monto: number | string }> = [];
  @Input() cambios_articulos: string;
  @Input() condicion_fact: string;

  htmlServ = inject(HtmlElementsService);
  divisaServ = inject(DivisaService);

  constructor(private shServ: SharedService) {
    super();
  }

  ngOnInit() {
    this.efectivo = fun.hasValue(this.efectivo) ? this.formatoNumero(this.efectivo) : '0.00';
    if (this.metodo != tipoDocFacturacion.compra) {
      this.metodosDePago = this.metodosDePago.length ? this.metodosDePago.map(pago => ({ ...pago, monto: this.formatoNumero(pago.monto) })) : [{ forma_pago: this.formaPago || 'Efectivo', monto: this.efectivo }];
    }
    if (!this.cambios_articulos) this.cambiar_articulos = 'no';
  }

  ngAfterViewInit(): void {
    Promise.all([
      this.cargarDivisaPrincipal(),
      this.cargarConfig(),
    ]).then(() => {
      this.isLoaded = true;

      requestAnimationFrame(() => {
        if (this.metodo != tipoDocFacturacion.compra) {
          this.enfocarFormaPago(0);
          if (this.pendingInitialEnter) {
            this.pendingInitialEnter = false;
            this.enfocarMontoRecibido(0);
          }
        }
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

  agregarMetodoPago() {
    if (!this.puedeAgregarMetodoPago()) return;

    const formaPago = this.opcionesDeFormaPago.find(opcion => !this.metodosDePago.some(pago => pago.forma_pago === opcion.value))?.value;
    if (!formaPago) return;

    this.metodosDePago = [...this.metodosDePago, { forma_pago: formaPago, monto: '0.00' }];
    this.validarForm('input');
  }

  opcionesFormaPago(index: number) {
    const formasSeleccionadas = new Set(this.metodosDePago.filter((_, pagoIndex) => pagoIndex !== index).map(pago => pago.forma_pago));
    return this.opcionesDeFormaPago.map(opcion => ({ ...opcion, disabled: formasSeleccionadas.has(opcion.value) }));
  }

  puedeAgregarMetodoPago() {
    return this.metodosDePago.length < this.maximosMetodosDePago;
  }

  eliminarMetodoPago(index: number) {
    if (this.metodosDePago.length <= 1) return;
    this.metodosDePago = this.metodosDePago.filter((_, itemIndex) => itemIndex !== index);
    this.validarForm('input');
  }

  onMetodoPagoBlur(pago: { monto: number | string }) {
    pago.monto = this.formatoNumero(pago.monto || 0);
    this.validarForm('input');
  }

  totalRecibido() {
    return this.metodosDePago.reduce((total, pago) => total + fun.desformatearStNumber(pago.monto || 0), 0);
  }

  metodosNetos() {
    const devuelta = fun.desformatearStNumber(this.devuelta);
    let pendienteDevuelta = devuelta;

    return this.metodosDePago
      .map(pago => {
        const monto = fun.desformatearStNumber(pago.monto || 0);
        const descuento = pago.forma_pago === 'Efectivo' ? Math.min(monto, pendienteDevuelta) : 0;
        pendienteDevuelta -= descuento;
        return { forma_pago: pago.forma_pago, monto: monto - descuento };
      })
      .filter(pago => pago.monto > 0);
  }

  focusFormaPago(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    this.enfocarFormaPago(0);
  }

  handleFormaPagoEnter(event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();

    this.closePrimeSelect(this.formaPagoInputs.toArray()[index]);
    this.enfocarMontoRecibido(index);
  }

  handleMontoRecibidoEnter(event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();

    this.onMetodoPagoBlur(this.metodosDePago[index]);
    if (index < this.metodosDePago.length - 1) {
      this.enfocarFormaPago(index + 1);
      return;
    }

    if (this.validarForm()) {
      fun.toastWarning(this.mensajeValidacion(), 'AVISO');
      this.enfocarMontoRecibido(index);
      return;
    }

    this.focusConfirmButton();
  }

  handleMontoRecibidoKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const agregar = event.key === '+' || event.code === 'NumpadAdd' || (event.code === 'Equal' && event.shiftKey) || event.keyCode === 107;
    const eliminar = event.key === '-' || event.code === 'NumpadSubtract' || event.code === 'Minus' || event.keyCode === 109;
    if (!agregar && !eliminar) return;

    event.preventDefault();
    event.stopPropagation();
    const focoActivoId = (document.activeElement as HTMLElement | null)?.id;
    if (agregar) this.agregarMetodoPago();
    if (eliminar) this.eliminarMetodoPago(this.metodosDePago.length - 1);
    this.restaurarFoco(focoActivoId);
  }

  private enfocarFormaPago(index: number): void {
    this.focusPrimeSelect(this.formaPagoInputs.toArray()[index], index);
  }

  private enfocarMontoRecibido(index: number): void {
    fun.setTimeout(() => {
      const input = document.getElementById(`montoRecibido-${index}`) as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
      input?.select();
    }, 30);
  }

  private restaurarFoco(id?: string): void {
    requestAnimationFrame(() => {
      document.getElementById(id || '')?.focus({ preventScroll: true });
      requestAnimationFrame(() => this.realinearPopoversDeFormaPago());
    });
  }

  private realinearPopoversDeFormaPago(): void {
    this.formaPagoInputs.forEach(selectComponent => {
      if (selectComponent.overlayVisible) selectComponent.overlayViewChild?.alignOverlay?.();
    });
  }

  focusConfirmButton() {
    fun.setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.dynamic-modal-button[data-modal-button-id="btnConfirmar"]'));
      const button = buttons.find(btn => btn.dataset['modalId'] === this.modalConfig.id && !btn.disabled) ?? buttons.find(btn => !btn.disabled);
      button?.focus({ preventScroll: true });
    }, 30);
  }

  private focusPrimeSelect(selectComponent: any, index: number): void {
    fun.setTimeout(() => {
      requestAnimationFrame(() => {
        const combobox = document.getElementById(`formaPago-${index}`) as HTMLElement | null;

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
        fun.toastWarning(this.mensajeValidacion(), 'AVISO');
        fun.enfocarInput('inputEfectivo');
      }
    });
  }

  calcularDevueta() {
    if (this.metodo == tipoDocFacturacion.compra && fun.isEmpty(this.efectivo)) {
      this.devuelta = '0.00';
    } else {
      const total = fun.desformatearStNumber(this.total_factura);
      const efectivo = this.metodo == tipoDocFacturacion.compra ? fun.desformatearStNumber(this.efectivo) : this.totalRecibido();

      const dev = efectivo - total;

      this.devuelta = efectivo == 0 ? '0.00' : this.formatoNumero(isNaN(dev) ? '0.00' : Math.max(0, dev));
    }
  }

  cancelar() {
    this.cancel.emit();
  }

  btn_aceptar() {
    const devuelta_ = fun.desformatearStNumber(this.devuelta);
    const efectivo = this.metodo == tipoDocFacturacion.compra ? fun.desformatearStNumber(this.efectivo) : this.totalRecibido();
    const metodos_de_pago = this.metodo == tipoDocFacturacion.compra ? [] : this.metodosNetos();
    const obj = { dinero: efectivo, devuelta: this.devuelta ? devuelta_ : 0, forma_pago: metodos_de_pago.length === 1 ? metodos_de_pago[0].forma_pago : 'Mixto', metodos_de_pago, decision_cambio: this.cambiar_articulos === 'si' ? true : false };

    if (this.metodo == tipoDocFacturacion.compra) {
      if (this.cambiar_articulos != undefined) {
        this.modalConfig.close({ obj, is_print: this.is_print, modal_id: this.modalConfig.id });
      } else {
        fun.toastWarning('Debe de marcar una opcion en el cambio de costos de los articulos', 'AVISO');
      }
    } else {
      if (this.validarForm()) {
        fun.toastError(this.mensajeValidacion(), 'ERROR');
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
    const efectivo = this.metodo == tipoDocFacturacion.compra ? fun.desformatearStNumber(this.efectivo) : this.totalRecibido();

    let isInvalid = isNaN(efectivo) ? true : total > efectivo;
    if (this.metodo != tipoDocFacturacion.compra && efectivo > total) {
      const efectivoDisponible = this.metodosDePago.filter(pago => pago.forma_pago === 'Efectivo').reduce((sum, pago) => sum + fun.desformatearStNumber(pago.monto || 0), 0);
      isInvalid = efectivo - total > efectivoDisponible;
    }

    if (this.metodo == tipoDocFacturacion.compra) isInvalid = false;

    if (from == 'input' || from == 'init') this.disableBtnConfirm(isInvalid);

    return isInvalid;
  }

  disableBtnConfirm(validate) {
    const btnConfirmar = this.modalConfig.botones.find(btn => btn.id == 'btnConfirmar');
    if (!btnConfirmar) return;

    btnConfirmar.disable = validate;
    btnConfirmar.tooltip = validate ? this.mensajeValidacion() : '';
  }

  private mensajeValidacion(): string {
    const documento = this.metodo == tipoDocFacturacion.recibo_ingreso ? 'del recibo.' : 'de la factura.';
    if (this.excedenteSinEfectivo()) {
      return 'El excedente solo puede devolverse en efectivo.';
    }

    return `El monto ingresado no cubre el valor ${documento}`;
  }

  private excedenteSinEfectivo(): boolean {
    if (this.metodo == tipoDocFacturacion.compra) return false;

    const total = fun.desformatearStNumber(this.total_factura);
    const recibido = this.totalRecibido();
    if (isNaN(total) || isNaN(recibido) || recibido <= total) return false;

    const efectivoDisponible = this.metodosDePago
      .filter(pago => pago.forma_pago === 'Efectivo')
      .reduce((sum, pago) => sum + fun.desformatearStNumber(pago.monto || 0), 0);

    return recibido - total > efectivoDisponible;
  }
}
