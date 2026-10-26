import { Component, EventEmitter, HostListener, Input, Output, ViewChild, computed, signal } from '@angular/core';

export interface FiltrosViaje {
  mostrarCompletadas: boolean;
  condicion: string;
  camionId: string | number;
  choferId: string | number;
}

@Component({
  selector: 'app-filtros-viajes',
  templateUrl: './filtros-viajes.component.html',
  styleUrls: ['./filtros-viajes.component.scss'],
  standalone: false,
})
export class FiltrosViajesComponent {
  @ViewChild('filtrosPopover') filtrosPopover: any;

  private readonly camionesSignal = signal<any[]>([]);
  private readonly choferesSignal = signal<any[]>([]);

  @Input() set camiones(value: any[]) {
    this.camionesSignal.set(value ?? []);
  }

  @Input() set choferes(value: any[]) {
    this.choferesSignal.set(value ?? []);
  }
  @Output() filtersChange = new EventEmitter<FiltrosViaje>();

  readonly mostrarCompletadas = signal(false);
  readonly condicion = signal('');
  readonly camionId = signal<string | number>('');
  readonly choferId = signal<string | number>('');
  readonly filtrosActivos = computed(() => [this.mostrarCompletadas(), this.condicion(), this.camionId(), this.choferId()].filter(Boolean).length);
  filtrosPendientes = false;
  popoverVisible = false;

  readonly condiciones = [
    { label: 'Todas', value: '' },
    { label: 'Contado', value: 'Contado' },
    { label: 'Crédito', value: 'Crédito' },
  ];

  readonly camionesConTodos = computed(() => [{ info_vehiculo: 'Todos', id: '' }, ...this.camionesSignal()]);
  readonly choferesConTodos = computed(() => [{ nombre_completo: 'Todos', id: '' }, ...this.choferesSignal()]);

  setMostrarCompletadas(value: boolean) {
    this.mostrarCompletadas.set(value);
    this.filtrosPendientes = true;
  }

  setCondicion(value: string) {
    this.condicion.set(value || '');
    this.filtrosPendientes = true;
  }

  setCamion(value: string | number) {
    this.camionId.set(value ?? '');
    this.filtrosPendientes = true;
  }

  setChofer(value: string | number) {
    this.choferId.set(value ?? '');
    this.filtrosPendientes = true;
  }

  @HostListener('document:click', ['$event'])
  cerrarAlHacerClickFuera(event: MouseEvent) {
    if (!this.popoverVisible) return;

    const estaDentroDeFiltros = event.composedPath().some(elemento => {
      return elemento instanceof Element && elemento.matches('.filtros-viajes-popover, .filtros-viajes-trigger, .p-select, .p-select-overlay, .p-select-list-container, .p-select-option');
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
    this.mostrarCompletadas.set(false);
    this.condicion.set('');
    this.camionId.set('');
    this.choferId.set('');
    this.filtrosPendientes = false;
    this.emitirCambios();
    this.filtrosPopover?.hide();
  }

  private emitirCambios() {
    this.filtersChange.emit({
      mostrarCompletadas: this.mostrarCompletadas(),
      condicion: this.condicion(),
      camionId: this.camionId(),
      choferId: this.choferId(),
    });
  }
}
