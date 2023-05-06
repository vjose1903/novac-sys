import { CuentasContablesFormComponent } from './cuentas-contables-form/cuentas-contables-form.component';
import { IconsArrayModule } from './../../../components/new_tablas/icons-array/icons-array.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PipesModule } from '../../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../../modules/ngx-bootstrap.module';
import { PrimengModule } from '../../../../modules/primeng.module';
import { BtnIconModule } from '../../../components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '../../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../../core/directive/directives.module';

import { CatalogoCuentasComponent } from './catalogo-cuentas.component';
import { TreeTableModule } from 'primeng/treetable';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const components = [CatalogoCuentasComponent, CuentasContablesFormComponent];

@NgModule({
  declarations: components,
  imports: [CommonModule, PipesModule, NgxBootstrapModule, PrimengModule, BtnIconModule, TablasModule, DirectivesModule, TreeTableModule, IconsArrayModule, ReactiveFormsModule, FormsModule],
  exports: components,
})
export class CatalogoCuentasModule {}
