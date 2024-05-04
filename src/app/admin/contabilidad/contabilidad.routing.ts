import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'catalogo_cuentas', loadChildren: () => import('./catalogo-cuentas-page/catalogo-cuentas-page.module').then((m) => m.CatalogoCuentasPageModule) },
  { path: 'configuracion_entidad_cuenta', loadChildren: () => import('./configuracion-entidad-cuenta/configuracion-entidad-cuenta.module').then((m) => m.ConfiguracionEntidadCuentaModule) },
  { path: 'libro_diario', loadChildren: () => import('./libro-diario-page/libro-diario-page.module').then((m) => m.LibroDiarioPageModule) },
  { path: 'deposito', loadChildren: () => import('./deposito/deposito.module').then((m) => m.DepositoModule) },
  { path: 'transferencia', loadChildren: () => import('./transferencias/transferencias.module').then((m) => m.TransferenciasModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContabilidadRoutingModule {}
