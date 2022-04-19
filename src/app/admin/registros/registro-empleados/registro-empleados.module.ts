import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroEmpleadosRoutingModule } from './registro-empleados.routing';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';

@NgModule({
  declarations: [RegistroEmpleadosComponent],
  imports: [CommonModule, RegistroEmpleadosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, NewTablasModule, TablasModule, DirectivesModule, PipesModule, NgxBootstrapModule],
})
export class RegistroEmpleadosModule {}
