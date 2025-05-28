import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IngresosComponent } from './recibo-ingresos/Formulario/ingresos.component';
import { ListaRecibosComponent } from './recibo-ingresos/lista-recibos/lista-recibos.component';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { Permisos } from '@core/typescript/permisos';

const routes: Routes = [
  {
    path: 'lista_ingresos',
    component: ListaRecibosComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.recibo_ingreso), 'admin/dashboard')],
  },
  {
    path: 'ingresos/:cliente_id/:factura_id',
    component: IngresosComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard([Permisos.recibo_ingreso.create, Permisos.recibo_ingreso.read_one, Permisos.recibo_ingreso.update, Permisos.recibo_ingreso.destroy], 'admin/dashboard')],
  },
  {
    path: 'viajes/:id',
    component: ReciboViajesComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.recibo_ingreso), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecibosRoutingModule {}
