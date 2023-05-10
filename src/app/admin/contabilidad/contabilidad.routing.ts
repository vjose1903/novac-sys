import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'catalogo_cuentas', loadChildren: () => import('./catalogo-cuentas-page/catalogo-cuentas-page.module').then((m) => m.CatalogoCuentasPageModule) },
  { path: 'configuracion_entidad_cuenta', loadChildren: () => import('./configuracion-entidad-cuenta/configuracion-entidad-cuenta.module').then((m) => m.ConfiguracionEntidadCuentaModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContabilidadRoutingModule {}
