import { Component, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, HostListener, inject, Input, QueryList, ViewChildren, signal, computed } from '@angular/core';
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
import Big from 'big.js';

@Component({
  selector: 'app-form-cantidad-efectivo',
  templateUrl: './form-cantidad-efectivo.component.html',
  styleUrls: ['./form-cantidad-efectivo.component.scss'],
  standalone: false,
})
export class FormCantidadEfectivoComponent extends MixinClass implements OnInit, AfterViewInit, OnDestroy, IDynamicModal {
  @ViewChildren('formaPagoInput') formaPagoInputs!: QueryList<any>;
  private readonly metodosDePagoState = signal<Array<{ forma_pago: string; monto: number | string }>>([]);
  private readonly totalRecibidoBig = computed(() => {
    let total = Big(0);
    for (const pago of this.metodosDePagoState()) {
      const monto = this.montoBig(pago.monto || 0);
      if (!monto) return null;
      total = total.plus(monto);
    }
    return total;
  });

  @Input()
  set metodosDePago(value: Array<{ forma_pago: string; monto: number | string }>) {
    this.metodosDePagoState.set(value || []);
  }
  get metodosDePago() {
    return this.metodosDePagoState();
  }

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

  private readonly metodoPagoShortcutListener = (event: KeyboardEvent) => this.handleMetodoPagoShortcut(event);

  handleMetodoPagoShortcut(event: KeyboardEvent) {
    if (this.metodo == tipoDocFacturacion.compra || event.ctrlKey || event.metaKey || event.altKey) return;

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
    document.addEventListener('keydown', this.metodoPagoShortcutListener, true);
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

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.metodoPagoShortcutListener, true);
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

  actualizarFormaPago(index: number, forma_pago: string) {
    this.metodosDePago = this.metodosDePago.map((pago, pagoIndex) => pagoIndex === index ? { ...pago, forma_pago } : pago);
    this.validarForm('input');
  }

  actualizarMontoRecibido(index: number, monto: number | string) {
    this.metodosDePago = this.metodosDePago.map((pago, pagoIndex) => pagoIndex === index ? { ...pago, monto } : pago);
    this.calcularDevueta();
    this.validarForm('input');
  }

  onMetodoPagoBlur(index: number, event?: Event) {
    const monto = (event?.target as HTMLInputElement | null)?.value ?? this.metodosDePago[index]?.monto;
    this.actualizarMontoRecibido(index, this.formatoNumero(monto || 0));
  }

  totalRecibido() {
    return (this.totalRecibidoBig() || Big(0)).toNumber();
  }

  private montoBig(valor) {
    const normalizado = String(valor ?? 0).replaceAll(',', '').trim() || '0';
    try {
      return Big(normalizado);
    } catch {
      return null;
    }
  }

  metodosNetos() {
    const devuelta = this.montoBig(this.devuelta) || Big(0);
    let pendienteDevuelta = devuelta;

    return this.metodosDePago
      .map(pago => {
        const monto = this.montoBig(pago.monto || 0) || Big(0);
        const descuento = pago.forma_pago !== 'Tarjeta' ? (monto.lt(pendienteDevuelta) ? monto : pendienteDevuelta) : Big(0);
        pendienteDevuelta = pendienteDevuelta.minus(descuento);
        return { forma_pago: pago.forma_pago, monto: monto.minus(descuento).toNumber() };
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

    this.onMetodoPagoBlur(index, event);
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
      this.btn_aceptar();
    }
  }

  formatoNumero(num) {
    if (fun.isEmpty(num)) return num;

    const monto = this.montoBig(num);
    if (!monto) return String(num);

    const [enteros, decimales] = monto.toFixed(2).split('.');
    return `${enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimales}`;
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
      const total = this.montoBig(this.total_factura);
      const efectivo = this.metodo == tipoDocFacturacion.compra ? this.montoBig(this.efectivo) : this.totalRecibidoBig();

      if (!total || !efectivo || efectivo.eq(0) || efectivo.lte(total)) {
        this.devuelta = '0.00';
        return;
      }

      this.devuelta = this.formatoNumero(efectivo.minus(total).toFixed(2));
    }
  }

  cancelar() {
    this.cancel.emit();
  }

  btn_aceptar() {
    const devuelta_ = (this.montoBig(this.devuelta) || Big(0)).toNumber();
    const efectivo = this.metodo == tipoDocFacturacion.compra ? (this.montoBig(this.efectivo) || Big(0)).toNumber() : this.totalRecibido();
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
    const total = this.montoBig(this.total_factura);
    const efectivo = this.metodo == tipoDocFacturacion.compra ? this.montoBig(this.efectivo) : this.totalRecibidoBig();

    let isInvalid = !total || !efectivo || total.gt(efectivo);

    if (!isInvalid && this.metodo != tipoDocFacturacion.compra) {
      const totalTarjeta = this.metodosDePago
        .filter(pago => pago.forma_pago === 'Tarjeta')
        .reduce((suma, pago) => suma.plus(this.montoBig(pago.monto || 0) || Big(0)), Big(0));
      const tieneOtroMetodo = this.metodosDePago.some(pago => pago.forma_pago !== 'Tarjeta');

      isInvalid = totalTarjeta.gt(total) || (efectivo.gt(total) && !tieneOtroMetodo);
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
    const total = this.montoBig(this.total_factura);
    const totalRecibido = this.totalRecibidoBig();
    const totalTarjeta = this.metodosDePago
      .filter(pago => pago.forma_pago === 'Tarjeta')
      .reduce((suma, pago) => suma.plus(this.montoBig(pago.monto || 0) || Big(0)), Big(0));
    const tieneOtroMetodo = this.metodosDePago.some(pago => pago.forma_pago !== 'Tarjeta');

    if (total && totalTarjeta.gt(total)) return 'El monto pagado con tarjeta no puede superar el total del documento.';
    if (total && totalRecibido?.gt(total) && !tieneOtroMetodo) return 'La devuelta debe corresponder a un método de pago distinto a tarjeta.';

    const documento = this.metodo == tipoDocFacturacion.recibo_ingreso ? 'del recibo.' : 'de la factura.';
    return `El monto ingresado no cubre el valor ${documento}`;
  }
}
