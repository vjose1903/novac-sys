import { CategoriaEntidadContableModule } from './../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroClientesRoutingModule } from './registro-clientes.routing';
import { RegistroClientesComponent } from './registro-clientes.component';
import { ImgViewerEditModule } from '../../components/img-viewer-edit/img-viewer-edit.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { EntidadCuentaContableModule } from '../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.module';

@NgModule({
  declarations: [RegistroClientesComponent],
  imports: [
    CommonModule,
    RegistroClientesRoutingModule,
    ImgViewerEditModule,
    TablasModule,
    ReactiveFormsModule,
    FormsModule,
    DirectivesModule,
    PrimengModule,
    NgxPermissionsModule.forChild(),
    CategoriaEntidadContableModule,
    EntidadCuentaContableModule,
  ],
})
export class RegistroClientesModule {}
