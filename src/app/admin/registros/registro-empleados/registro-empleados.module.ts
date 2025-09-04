import { EntidadCuentaContableModule } from './../../contabilidad/entidad-cuenta-contable/entidad-cuenta-contable.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroEmpleadosRoutingModule } from './registro-empleados.routing';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { PipesModule } from '@core/pipe/pipes.module';
import { NgxPermissionsModule } from 'ngx-permissions';
<<<<<<< HEAD
import { CategoriaEntidadContableModule } from '../../contabilidad/categoria-entidad-contable/categoria-entidad-contable.module';

@NgModule({
  declarations: [RegistroEmpleadosComponent],
  imports: [CommonModule, RegistroEmpleadosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, TablasModule, DirectivesModule, PipesModule, NgxPermissionsModule.forChild(), CategoriaEntidadContableModule, EntidadCuentaContableModule],
=======
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';

@NgModule({
  declarations: [RegistroEmpleadosComponent],
  imports: [CommonModule, RegistroEmpleadosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, TablasModule, DirectivesModule, PipesModule, NgxPermissionsModule.forChild(), FormErrorMsgComponent],
>>>>>>> dev
})
export class RegistroEmpleadosModule {}
