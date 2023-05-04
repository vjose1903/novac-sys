import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [{ path: 'catalogo_cuentas', loadChildren: () => import('./catalogo-cuentas-page/catalogo-cuentas-page.module').then((m) => m.CatalogoCuentasPageModule) }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContabilidadRoutingModule {}
