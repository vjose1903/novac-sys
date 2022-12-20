import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../loader/loader.service';
import { MixinClass } from '../../core/typescript/MixinClass';
import * as _ from 'lodash';
import { ReporteC } from './reporte';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { FacturaC } from '../facturacion/factura';
import { ArticuloC } from '../registros/articulos/articulo';
import { InventarioC } from '../inventario/inventario';
import { ReciboC } from '../recibos/recibos';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { CuadreC } from './../cuadres/cuadres';
import { NotaC } from '../manipular facturas/notas-cred-deb/notas';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent extends MixinClass implements OnInit, OnDestroy {
  reporteClass = new ReporteC();

  instancesClases = {
    cuadre: CuadreC,
    ventas_diarias: FacturaC,
    ventas_rango: FacturaC,
    ventas_productos: ArticuloC,
    inventario: InventarioC,
    suplidor_prod: SuplidorC,
    cuentas_cobrar_cliente: ClienteC,
    cuentas_cobrar_ant_saldo: ClienteC,
    cuentas_con_pagos: ClienteC,
    ventas_cliente: ClienteC,
    recibos: ReciboC,
    notas: NotaC,
  };

  constructor(public loadServ: LoaderService) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reportes', is_routing: true });
  }

  iniciarCambioMenu(arg, callback) {
    if (arg.bool) {
      this.runFinalizarCambioMenu(arg);
      callback({ bool: true });
    }
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  openReporteForm(params: { tipo: string; titulo: string }) {
    const obj = { tipo: 'reportes', titulo: params.titulo, tipo_reporte: params.tipo };
    this.instancesClases[params.tipo.toString()].openModalReporteForm({ tipo: params.tipo, inputs: obj, openNewModal: this.openNewModal.bind(this) });
  }
}
