import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeAdminComponent } from '../home/homeAdmin.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProduccionComponent } from '../produccion/produccion.component';
import { ReportesComponent } from '../reportes/reportes.component';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: HomeAdminComponent,
      },
      {
        path: 'factura',
        loadChildren: () => import('../facturacion/facturacion.module').then((m) => m.FacturacionModule),
      },

      {
        path: 'produccion',
        component: ProduccionComponent,
      },
      {
        path: 'registros',
        loadChildren: () => import('../registros/registros.module').then((m) => m.RegistrosModule),
      },
      {
        path: 'manipular',
        loadChildren: () => import('../manipular facturas/manipular-facturas.module').then((m) => m.ManipularFacturasModule),
      },
      {
        path: 'pagos',
        loadChildren: () => import('../pagos/pagos.module').then((m) => m.PagosModule),
      },
      {
        path: 'viajes',
        loadChildren: () => import('../viajes/viajes.module').then((m) => m.ViajesModule),
      },
      {
        path: 'contabilidad',
        loadChildren: () => import('../contabilidad/contabilidad.module').then((m) => m.ContabilidadModule),
      },

      {
        path: 'inventario',
        component: InventarioComponent,
      },

      {
        path: 'conduce',
        loadChildren: () => import('../conduce/conduce.module').then((m) => m.ConduceModule),
      },

      {
        path: 'reportes',
        component: ReportesComponent,
        // canActivate: [NgxPermissionsGuard],
        // data: {
        //   permissions: {
        //     only: Object.values(Permisos.reporte),
        //   },
        // },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
