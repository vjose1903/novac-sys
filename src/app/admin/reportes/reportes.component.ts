import { Permisos } from '@core/typescript/permisos';
import { Ss } from '@core/services/singleton.service';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../loader/loader.service';
import { MixinClass } from '@core/typescript/MixinClass';
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
  hasPermisoCamiones = signal(false);
  private permissionCamiones = false;
  private configSub?: Subscription;

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
    this.configSub = Ss.configServ.config$.subscribe(config => this.updateTravelReportVisibility(config));
    Ss.permissionsService
      .hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion)
      .then(result => {
        this.permissionCamiones = result;
        this.updateTravelReportVisibility(Ss.configServ?.config);
      });
  }

  ngOnDestroy() {
    this.configSub?.unsubscribe();
    this._destroy_mixin();
  }

  private updateTravelReportVisibility(config: any) {
    this.hasPermisoCamiones.set(this.permissionCamiones && config?.usa_modulo_viajes !== false);
  }

  openReporteForm(params: { tipo: string; titulo: string }) {
    ReporteC.configCsv = undefined;
    this.instancesClases[params.tipo.toString()].openModalReporteForm({ tipo: params.tipo, titulo: params.titulo });
  }

  openCuadres() {
    this.router.navigate(['/admin/cuadres'], { queryParams: { nuevo: true } });
  }
}
