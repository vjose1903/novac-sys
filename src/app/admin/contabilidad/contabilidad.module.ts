import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadRoutingModule } from './contabilidad.routing';
import { CatalogoCuentasPageComponent } from './catalogo-cuentas-page/catalogo-cuentas-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

import { PipesModule } from '../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../app/modules/ngx-bootstrap.module';
import { PrimengModule } from '../../../app/modules/primeng.module';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../core/directive/directives.module';
import { CatalogoCuentasComponent } from './catalogo-cuentas-page/catalogo-cuentas/catalogo-cuentas.component';

@NgModule({
  declarations: [CatalogoCuentasPageComponent, CatalogoCuentasComponent],
  imports: [CommonModule, ContabilidadRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, NgxBootstrapModule, TablasModule, DirectivesModule, NgxPermissionsModule, BtnIconModule],
})
export class ContabilidadModule {}
