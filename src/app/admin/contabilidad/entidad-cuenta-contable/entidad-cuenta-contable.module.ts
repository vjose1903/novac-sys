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
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';

const components = [EntidadCuentaContableComponent, CuentaContableFormComponent];

@NgModule({
  declarations: components,
  imports: [CommonModule, PipesModule, PrimengModule, TablasModule, AccordionModule, DirectivesModule, FormsModule, ReactiveFormsModule, ButtonModule, ButtonGroupModule, NgxPermissionsModule.forChild()],
  exports: components,
})
export class EntidadCuentaContableModule {}
