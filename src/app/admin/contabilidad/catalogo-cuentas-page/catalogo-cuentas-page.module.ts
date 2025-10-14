import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PipesModule } from '@core/pipe/pipes.module';
import { PrimengModule } from '@modules/primeng.module';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';

import { CatalogoCuentasPageComponent } from './catalogo-cuentas-page.component';
import { CatalogoCuentasModule } from './catalogo-cuentas/catalogo-cuentas.module';
import { CatalogoCuentasPageRoutingModule } from './catalogo-cuentas-page.routing';

@NgModule({
  declarations: [CatalogoCuentasPageComponent],
  imports: [CommonModule, CatalogoCuentasModule, PipesModule, PrimengModule, BtnIconModule, TablasModule, DirectivesModule, CatalogoCuentasPageRoutingModule],
})
export class CatalogoCuentasPageModule {}
