import { Component, effect, Input, OnInit, signal } from '@angular/core';
import { MixinClass } from '@core/typescript/MixinClass';
import { ModalI } from '../../modal/modal-class';
import { table_config } from '../../new_tablas/tabla-class';
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
  // TODO: Cambiar a DynamicModalComponent
  activeIndex = signal(0);
  processingTabChange = true;

  table_pagos_config: table_config = {
    info: [
      { titulo: 'Fecha abono', tipo: 'text', key: 'fecha_equivalente' },
      { titulo: 'NO. recibo', tipo: 'text', key: 'numero_recibo' },
      { titulo: 'Abonado', tipo: 'formatoNumero', key: 'deposito' },
      { titulo: 'Mora', tipo: 'formatoNumero', key: 'mora' },
      { titulo: 'Total', tipo: 'formatoNumero', key: 'total' },
    ],
    colores: true,
    id_tabla: 'listado_pagos',
  };
  tablaPagosComponent;

  table_notas_config: table_config = {
    info: [
      { titulo: 'NO. comprobante', tipo: 'text', key: 'numero_comprobante' },
      { titulo: 'Tipo', tipo: 'text', key: 'tipo_label' },
      { titulo: 'Monto', tipo: 'formatoNumero', key: 'total' },
      { titulo: 'Fecha nota', tipo: 'text', key: 'fecha_equivalente' },
    ],
    colores: true,
    id_tabla: 'listado_notas',
  };
  tablaNotasComponent;
  show = true;

  constructor() {
    super();
    effect(() => {
      if (fun.hasValue(this.activeIndex()) && !this.processingTabChange) {
        this.processingTabChange = true;
        this.show = false;
        const tipo = this.activeIndex() == 0 ? 'abonos' : 'notas';
        const cantidad = this.arrayHasData(tipo).cant;
        const opositeIndex = this.activeIndex() == 0 ? 1 : 0;

        if (cantidad <= 0) this.activeIndex.set(opositeIndex);

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
  inputs: any;

  ngOnInit() {
    this.activeIndex.set(this.arrayHasData('abonos').cant > 0 ? 0 : 1);
    this.processingTabChange = false;

    this.inputs['abonos'] = this.inputs['abonos'].map(abono => {
      abono.total = abono.deposito + abono.mora;
      return abono;
    });
  }

  arrayHasData(tipo) {
    return { disable: this.inputs[tipo].length == 0, cant: this.inputs[tipo].length };
  }

  btn_aceptar() {
    throw new Error('Method not implemented.');
  }
}
