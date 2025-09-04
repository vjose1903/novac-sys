import { EntidadCuentaContableModule } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroSuplidoresRoutingModule } from './registro-suplidores.routing';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CategoriaEntidadContableModule } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.module';
import { ImgModule } from '../../components/img-component/img.module';
import { FormDivisaInputModule } from '../../../core/components/form-fields/form-divisa-input/form-divisa-input.module';

@NgModule({
  declarations: [RegistroSuplidoresComponent],
  imports: [
    CommonModule,
    RegistroSuplidoresRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    TablasModule,
    DirectivesModule,
    PrimengModule,
    NgxPermissionsModule.forChild(),
    CategoriaEntidadContableModule,
    EntidadCuentaContableModule,
    ImgModule,
    FormDivisaInputModule,
  ],
})
export class RegistroSuplidoresModule {}
