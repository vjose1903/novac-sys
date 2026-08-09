import { Component, inject, OnInit } from '@angular/core';
import { TablasService } from '@core/components/new_tablas/tablas.service';
import { MixinClass } from '@core/typescript/MixinClass';
import { LoaderService } from 'app/loader/loader.service';
import { FacturasRecibidasC, FacturasRecibidasI } from './facturas-recibidas.model';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BtnIconModule } from '@core/components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '@core/components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { PipesModule } from '@core/pipe/pipes.module';
import { PrimengModule } from 'app/modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { FacturasRecibidasService } from './facturas-recibidas.service';
import { default_per_page, table_config } from '@core/components/new_tablas/tabla-class';
import { fun } from '@core/services/functions.service';
@Component({
  selector: 'app-facturas-recibidas',
  templateUrl: './facturas-recibidas.component.html',
  styleUrl: './facturas-recibidas.component.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, TablasModule, DirectivesModule, NgxPermissionsModule, BtnIconModule],
})
export class FacturasRecibidasComponent extends MixinClass implements OnInit {
  tServ = inject(TablasService);
  loadServ = inject(LoaderService);
  facturasRecibidasService = inject(FacturasRecibidasService);

  facturaRecibidaSelected: FacturasRecibidasI;
  facturasRecibidasList: FacturasRecibidasI[] = [];
  facturasRecibidasClass = new FacturasRecibidasC();

  table_config: table_config = {
    info: [
      { titulo: 'Número de comprobante', tipo: 'text', key: 'eNCF' },
      { titulo: 'Suplidor', tipo: 'text', key: 'suplidor.nombre_completo' },
      { titulo: 'Rnc suplidor', tipo: 'text', key: 'rnc_emisor' },
      { titulo: 'Monto', tipo: 'text', key: 'monto_total' },
    ],
    colores: true,
    padding: '0.5rem',
    id_tabla: 'lista_facturas_recibidas',
    padre_functions: { data_request: params => this.getFacturasRecibidas(params) },
    filtrar: { local: false },
    obj_paginate: { show: true, showTotal: true, page: 1, per_page: 20, per_page_options: default_per_page, search: ' ', is_local: false },
    // botones: { editar: { show: true, permiso: this.permissions.suplidor.update }, borrar: { show: true, permiso: this.permissions.suplidor.destroy } },
  };
  tablaComponent;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this._init_mixin({ component: 'aprobaciones_comerciales_recibidas', is_routing: true });
    this.necesarioParaEmpezar();
  }



  necesarioParaEmpezar() {
    this.getFacturasRecibidas(this.tServ.obj_paginate.default);
  }

  getFacturasRecibidas(params?: { per_page?: number; page?: number; search?: string }) {
    const palabra_a_buscar = fun.isEmpty(params.search) ? ' ' : params.search;

    const extra = { parameters: { page: params.page, per_page: params.per_page, paginado: true, 'suplidor.nombre_completo': true, 'suplidor.id': true } };

    this.facturasRecibidasClass.getAll(extra).then(res => {
      this.facturasRecibidasList = res.data as FacturasRecibidasI[];

      this.facturasRecibidasList.map(factura => {
        if (fun.isEmpty(factura.suplidor)) {
          factura.suplidor = {
            nombre_completo: 'Suplidor no registrado',
          };
        }
        return factura;
      });

      this.table_config.total_count = res.total_registros;
      this.tablaComponent?.changeTableConfig([{ total_count: res.total_registros }]);
    });
  }
}
