import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeAdminComponent } from '../home/homeAdmin.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProduccionComponent } from '../produccion/produccion.component';
import { ReportesComponent } from '../reportes/reportes.component';
import { LayoutComponent } from './layout.component';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { Permisos } from '@core/typescript/permisos';
const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: HomeAdminComponent,
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'factura',
        loadChildren: () => import('../facturacion/facturacion.module').then(m => m.FacturacionModule),
      },
      {
        path: 'ecf',
        loadChildren: () => import('../facturacion-electronica/facturacion-electronica.module').then(m => m.FacturacionElectronicaModule),
      },
      {
        path: 'produccion',
        component: ProduccionComponent,
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'registros',
        loadChildren: () => import('../registros/registros.module').then(m => m.RegistrosModule),
      },
      {
        path: 'manipular',
        loadChildren: () => import('../manipular facturas/manipular-facturas.module').then(m => m.ManipularFacturasModule),
      },
      {
        path: 'pagos',
        loadChildren: () => import('../pagos/pagos.module').then(m => m.PagosModule),
      },
      {
        path: 'viajes',
        loadChildren: () => import('../viajes/viajes.module').then(m => m.ViajesModule),
      },
      {
        path: 'contabilidad',
        loadChildren: () => import('../contabilidad/contabilidad.module').then(m => m.ContabilidadModule),
      },
      // {
      //   path: 'recibos',
      //   loadChildren: () => import('../recibos/recibos.module').then(m => m.RecibosModule),
      // },
      {
        path: 'inventario',
        component: InventarioComponent,
        canDeactivate: [CanDeactivateGuard],
      },
      {
        path: 'conduce',
        loadChildren: () => import('../conduce/conduce.module').then(m => m.ConduceModule),
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.reporte), 'admin/dashboard')],
        canDeactivate: [CanDeactivateGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
