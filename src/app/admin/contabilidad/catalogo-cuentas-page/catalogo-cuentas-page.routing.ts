import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CatalogoCuentasPageComponent } from './catalogo-cuentas-page.component';

const routes: Routes = [{ path: '', component: CatalogoCuentasPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogoCuentasPageRoutingModule {}
