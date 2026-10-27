import { Component, EventEmitter, HostListener, Input, Output, ViewChild, signal, computed } from '@angular/core';
import { tipoDocFacturacion } from '../../../../facturacion/factura';

export interface FiltrosDocumento {
  condicion: string;
  estado: string;
  tipoFactura: string;
  totalMin: number | null;
  totalMax: number | null;
  balanceComparador: string;
  balanceValor: number | null;
}

@Component({
  selector: 'app-filtros-documentos',
  templateUrl: './filtros-documentos.component.html',
  styleUrls: ['./filtros-documentos.component.scss'],
  standalone: false,
})
export class FiltrosDocumentosComponent {
  @ViewChild('filtrosPopover') filtrosPopover: any;

  @Input() tipoDocumento: tipoDocFacturacion;
  @Input() tipoFacturaOptions: any[] = [];
  @Input() set resetVersion(value: number) {
    if (value === this.resetVersionValue) return;
    this.resetVersionValue = value;
    this.limpiarEstado(false);
  }
  @Input() set tipoFacturaResetVersion(value: number) {
    if (value === this.tipoFacturaResetVersionValue) return;
    this.tipoFacturaResetVersionValue = value;
    this.tipoFactura.set('0');
  }

  @Output() filtersChange = new EventEmitter<FiltrosDocumento>();

  readonly tipoDocFacturacion = tipoDocFacturacion;
  readonly condicion = signal('todos');
  readonly estado = signal('todos');
  readonly tipoFactura = signal('0');
  readonly totalMin = signal<number | null>(null);
  readonly totalMax = signal<number | null>(null);
  readonly balanceComparador = signal('gt');
  readonly balanceValor = signal<number | null>(null);
  readonly filtrosActivos = computed(() => [
    this.condicion() !== 'todos',
    this.estado() !== 'todos',
    this.tipoFactura() !== '0',
    this.totalMin() !== null,
    this.totalMax() !== null,
    this.balanceValor() !== null,
  ].filter(Boolean).length);

  filtrosPendientes = false;
  popoverVisible = false;
  private resetVersionValue = 0;
  private tipoFacturaResetVersionValue = 0;

  readonly condiciones = [
    { label: 'Todas las condiciones', value: 'todos' },
    { label: 'Contado', value: 'Contado' },
    { label: 'Crédito', value: 'Crédito' },
  ];
  readonly estados = [
    { label: 'Todos los estados', value: 'todos' },
    { label: 'Activos', value: 'true' },
    { label: 'Inactivos', value: 'false' },
  ];
  readonly comparadoresBalance = [
    { symbol: '=', label: 'Igual a', value: 'eq' },
    { symbol: '>', label: 'Mayor que', value: 'gt' },
    { symbol: '<', label: 'Menor que', value: 'lt' },
    { symbol: '>=', label: 'Mayor o igual a', value: 'gte' },
    { symbol: '<=', label: 'Menor o igual a', value: 'lte' },
  ];

  esVentaOCompra() {
    return this.tipoDocumento === tipoDocFacturacion.venta || this.tipoDocumento === tipoDocFacturacion.compra;
  }

  esCotizacion() {
    return this.tipoDocumento === tipoDocFacturacion.cotizacion;
  }

  setCondicion(value: string) {
    this.condicion.set(value || 'todos');
    this.filtrosPendientes = true;
  }

  setEstado(value: string) {
    this.estado.set(value || 'todos');
    this.filtrosPendientes = true;
  }

  setTipoFactura(value: string) {
    this.tipoFactura.set(value || '0');
    this.filtrosPendientes = true;
  }

  setTotalMin(value: number | string | null) {
    this.totalMin.set(this.parseNumericValue(value));
    this.filtrosPendientes = true;
  }

  setTotalMax(value: number | string | null) {
    this.totalMax.set(this.parseNumericValue(value));
    this.filtrosPendientes = true;
  }

  setBalanceComparador(value: string) {
    this.balanceComparador.set(value || 'gt');
    this.filtrosPendientes = true;
  }

  setBalanceValor(value: number | string | null) {
    this.balanceValor.set(this.parseNumericValue(value));
    this.filtrosPendientes = true;
  }

  private parseNumericValue(value: number | string | null) {
    if (value === null || value === '') return null;
    const parsed = Number(String(value).replaceAll(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  @HostListener('document:click', ['$event'])
  cerrarAlHacerClickFuera(event: MouseEvent) {
    if (!this.popoverVisible) return;

    const estaDentroDeFiltros = event.composedPath().some(elemento => {
      return elemento instanceof Element && elemento.matches('.filtros-documentos-popover, .filtros-documentos-trigger, .p-select, .p-select-overlay, .p-select-list-container, .p-select-option');
    });

    if (!estaDentroDeFiltros) this.filtrosPopover?.hide();
  }

  alMostrarPopover() {
    this.popoverVisible = true;
  }

  alCerrarPopover() {
    this.popoverVisible = false;
  }

  aplicarFiltros() {
    this.filtrosPendientes = false;
    this.emitirCambios();
    this.filtrosPopover?.hide();
  }

  limpiarFiltros() {
    this.limpiarEstado(true);
    this.filtrosPopover?.hide();
  }

  private limpiarEstado(emitir: boolean) {
    this.condicion.set('todos');
    this.estado.set('todos');
    this.tipoFactura.set('0');
    this.totalMin.set(null);
    this.totalMax.set(null);
    this.balanceComparador.set('gt');
    this.balanceValor.set(null);
    this.filtrosPendientes = false;
    if (emitir) this.emitirCambios();
  }

  private emitirCambios() {
    this.filtersChange.emit({
      condicion: this.condicion(),
      estado: this.estado(),
      tipoFactura: this.tipoFactura(),
      totalMin: this.totalMin(),
      totalMax: this.totalMax(),
      balanceComparador: this.balanceComparador(),
      balanceValor: this.balanceValor(),
    });
  }
}
