import { CuentaContableFormComponent } from './cuenta-contable-form/cuenta-contable-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '@core/directive/directives.module';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { PrimengModule } from './../../../modules/primeng.module';
import { PipesModule } from '@core/pipe/pipes.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntidadCuentaContableComponent } from './entidad-cuenta-contable.component';
import { NgxPermissionsModule } from 'ngx-permissions';

const components = [EntidadCuentaContableComponent, CuentaContableFormComponent];

@NgModule({
  declarations: components,
  imports: [CommonModule, PipesModule, PrimengModule, TablasModule, DirectivesModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild()],
  exports: components,
})
export class EntidadCuentaContableModule {}
