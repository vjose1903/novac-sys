import { Permisos } from './../../core/typescript/permisos';
import { Ss } from './../../core/services/singleton.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MixinClass } from '../../core/typescript/MixinClass';
import * as _ from 'lodash';
import { ReporteC } from './reporte';
import { ClienteC } from '../registros/registro-clientes/cliente';
import { FacturaC } from '../facturacion/factura';
import { ArticuloC } from '../registros/articulos/articulo';
import { InventarioC } from '../inventario/inventario';
import { ReciboC } from '../pagos/class/ingresos/recibos';
import { SuplidorC } from '../registros/registro-suplidores/suplidores';
import { CuadreC } from './../cuadres/cuadres';
import { NotaC } from '../manipular facturas/notas-cred-deb/notas';
import { PagoC } from '../pagos/class/pagos/pagos';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
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
    cuentas_pagar_suplidor: SuplidorC,
    cuentas_pagar_ant_saldo: SuplidorC,
    cuentas_cobrar_cliente: ClienteC,
    cuentas_cobrar_ant_saldo: ClienteC,
    cuentas_con_pagos: ClienteC,
    ventas_cliente: ClienteC,
    recibos: ReciboC,
    pago_facturas: PagoC,
    notas: NotaC,
  };

  permisos = Permisos.reporte;
  groupsPermisos = {
    cuadre: [this.permisos.cuadre],
    ventas: [this.permisos.ventas_diarias, this.permisos.ventas_rango, this.permisos.ventas_productos, this.permisos.cuentas_con_pagos, this.permisos.ventas_cliente, this.permisos.movimientos_vehiculo],
    productos: [this.permisos.inventario, this.permisos.suplidor_prod],
    cuentas: [this.permisos.cuentas_cobrar_cliente, this.permisos.cuentas_cobrar_ant_saldo, this.permisos.cuentas_pagar_suplidor, this.permisos.cuentas_pagar_ant_saldo],
    other: [this.permisos.recibos, this.permisos.pago_facturas, this.permisos.notas],
  };

  constructor() {
    super();
  }

  ngOnInit() {
    this._init_mixin({ component: 'reportes', is_routing: true });
    Ss.permissionsService.hasPermission(this.permissions.factura_venta.seleccionar_camion_en_facturacion).then((result) => (this.hasPermisoCamiones = result));
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
