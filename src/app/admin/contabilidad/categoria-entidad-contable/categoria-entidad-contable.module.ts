import { NgxPermissionsModule } from 'ngx-permissions';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { PrimengModule } from './../../../modules/primeng.module';
import { PipesModule } from './../../../core/pipe/pipes.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaEntidadContableComponent } from './categoria-entidad-contable.component';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';

const components = [CategoriaEntidadContableComponent];

@NgModule({
  declarations: components,
  imports: [CommonModule, PipesModule, PrimengModule, TablasModule, DirectivesModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild(), FormErrorMsgComponent],
  exports: components,
})
export class CategoriaEntidadContableModule {}
