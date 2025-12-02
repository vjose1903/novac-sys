import { Component, effect, Input, OnInit, signal } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { table_config, tableCellType } from '../../new_tablas/tabla-class';
import { fun } from '@core/services/functions.service';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';

@Component({
  selector: 'app-modal-historial-pagos',
  templateUrl: './modal-historial-pagos.component.html',
  styleUrls: ['./modal-historial-pagos.component.scss'],
  standalone: false,
})
export class ModalHistorialPagosComponent extends MixinClass implements OnInit, IDynamicModal {
  activeIndex = signal(0);
  processingTabChange = true;

  table_pagos_config: table_config = {
    track_key: 'id',
    info: [
      { titulo: 'Fecha', tipo: tableCellType.date, key: 'fecha_equivalente' },
      { titulo: 'NO. pago', tipo: tableCellType.text, key: 'numero' },
      { titulo: 'Pagado', tipo: tableCellType.formatoNumero, key: 'deposito' },
    ],
    colores: true,
    id_tabla: 'listado_pagos',
  };
  tablaPagosComponent;

  table_notas_config: table_config = {
    track_key: 'id',
    info: [
      { titulo: 'Fecha nota', tipo: tableCellType.date, key: 'fecha_equivalente' },
      { titulo: 'NO. comprobante', tipo: tableCellType.text, key: 'numero_comprobante' },
      { titulo: 'Tipo', tipo: tableCellType.text, key: 'tipo_label' },
      { titulo: 'Monto', tipo: tableCellType.formatoNumero, key: 'total' },
    ],
    colores: true,
    id_tabla: 'listado_notas',
  };
  tablaNotasComponent;

  table_recibos_config: table_config = {
    track_key: 'id',
    info: [
      { titulo: 'Fecha abono', tipo: tableCellType.text, key: 'fecha_equivalente' },
      { titulo: 'NO. recibo', tipo: tableCellType.text, key: 'numero_recibo' },
      { titulo: 'Abonado', tipo: tableCellType.formatoNumero, key: 'deposito' },
      { titulo: 'Mora', tipo: tableCellType.formatoNumero, key: 'mora' },
      { titulo: 'Total', tipo: tableCellType.formatoNumero, key: 'total' },
    ],
    colores: true,
    id_tabla: 'listado_recibos',
  };
  tablaRecibosComponent;

  show = true;

  showPagos = true;
  showRecibos = true;
  showNotas = true;

  constructor() {
    super();
    effect(() => {
      if (fun.hasValue(this.activeIndex()) && !this.processingTabChange) {
        this.processingTabChange = true;
        this.show = false;

        // Determinar el tipo basado en el índice actual
        const currentIndex = this.activeIndex();
        let tipo = 'pagos';

        if (currentIndex === this.getPagosIndex() && this.showPagos) {
          tipo = 'pagos';
        } else if (currentIndex === this.getNotasIndex() && this.showNotas) {
          tipo = 'notas';
        } else if (currentIndex === this.getRecibosIndex() && this.showRecibos) {
          tipo = 'recibos';
        }

        const cantidad = this.arrayHasData(tipo).cant;

        if (cantidad <= 0) {
          // Buscar el próximo tab disponible con datos
          const nextIndex = this.getInitialActiveIndex();
          this.activeIndex.set(nextIndex);
        }

        fun.setTimeout(() => {
          this.show = true;
        }, 10);

        fun.setTimeout(() => {
          this.processingTabChange = false;
        }, 250);
      }
    });
  }
  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() pagos!: any;
  @Input() recibos!: any;
  @Input() notas!: any;
  @Input() config: any = {};

  ngOnInit() {
    if (fun.objHas(this.config, 'showPagos')) this.showPagos = this.config.showPagos;
    if (fun.objHas(this.config, 'showRecibos')) this.showRecibos = this.config.showRecibos;
    if (fun.objHas(this.config, 'showNotas')) this.showNotas = this.config.showNotas;

    // Calcular el índice inicial basado en los tabs visibles
    this.activeIndex.set(this.getInitialActiveIndex());

    this.processingTabChange = false;
  }

  arrayHasData(tipo) {
    let data;
    if (tipo === 'pagos') data = this.pagos;
    else if (tipo === 'notas') data = this.notas;
    else if (tipo === 'recibos') data = this.recibos;
    else data = [];

    return { disable: data.length == 0, cant: data.length };
  }

  getInitialActiveIndex(): number {
    if (this.showPagos && this.arrayHasData('pagos').cant > 0) return this.getPagosIndex();
    if (this.showNotas && this.arrayHasData('notas').cant > 0) return this.getNotasIndex();
    if (this.showRecibos) return this.getRecibosIndex();
    return 0;
  }

  getPagosIndex(): number {
    let index = -1;
    if (this.showPagos) index++;
    return index;
  }

  getNotasIndex(): number {
    let index = 0;
    if (this.showPagos) index++;
    return index;
  }

  getRecibosIndex(): number {
    let index = 0;
    if (this.showPagos) index++;
    if (this.showNotas) index++;
    return index;
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
