import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CatalogoCuentasPageComponent } from './catalogo-cuentas-page/catalogo-cuentas-page.component';

const routes: Routes = [{ path: 'catalogo_cuentas', component: CatalogoCuentasPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContabilidadRoutingModule {}
