import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoaderService } from '../../loader/loader.service';
import { MixinClass } from '@core/typescript/MixinClass';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { ReporteC } from './reporte';
import { ClienteC } from '@registros/registro-clientes/cliente';
import { FacturaC } from '../facturacion/factura';
import { ArticuloC } from '@registros/articulos/articulo';
import { InventarioC } from '../inventario/inventario';
import { ReciboC } from '../recibos/recibos';
import { SuplidorC } from '@registros/registro-suplidores/suplidores';
import { CuadreC } from './../cuadres/cuadres';
import { NotaC } from '../manipular facturas/notas-cred-deb/notas';
export enum SearchBy {
  general = 1,
  por_cliente = 2,
}
@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  standalone: false,
})
export class ReportesComponent extends MixinClass implements OnInit, OnDestroy {
  reporteClass = new ReporteC();

  permissions = Permisos;
  hasPermisoCamiones: boolean;

  instancesClases = {
    cuadre: CuadreC,
    ventas_diarias: FacturaC,
    ventas_rango: FacturaC,
    movimientos_vehiculo: FacturaC,
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

  constructor(public loadServ: LoaderService, private router: Router) {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reportes', is_routing: true });
    Ss.permissionsService.hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion).then(result => (this.hasPermisoCamiones = result));
  }

  ngOnDestroy() {
    this._destroy_mixin();
  }

  openReporteForm(params: { tipo: string; titulo: string }) {
    ReporteC.configCsv = undefined;
    this.instancesClases[params.tipo.toString()].openModalReporteForm({ tipo: params.tipo, titulo: params.titulo });
  }

  openCuadres() {
    this.router.navigate(['/admin/cuadres'], { queryParams: { nuevo: true } });
  }
}
