import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
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
        loadChildren: () => import('../home/home.module').then(m => m.HomeModule),
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
        loadChildren: () => import('../produccion/produccion.module').then(m => m.ProduccionModule),
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
        path: 'recibos',
        loadChildren: () => import('../recibos/recibos.module').then(m => m.RecibosModule),
      },
      {
        path: 'inventario',
        loadChildren: () => import('../inventario/inventario.module').then(m => m.InventarioModule),
      },
      {
        path: 'conduce',
        loadChildren: () => import('../conduce/conduce.module').then(m => m.ConduceModule),
      },
      {
        path: 'reportes',
        loadChildren: () => import('../reportes/reportes.module').then(m => m.ReportesModule),
      },
      {
        path: 'cuadres',
        loadChildren: () => import('../cuadres/cuadres.module').then(m => m.CuadresModule),
      },
      {
        path: 'calendario',
        loadChildren: () => import('../calendario/calendario.module').then(m => m.CalendarioModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
