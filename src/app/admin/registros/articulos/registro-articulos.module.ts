import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArticulosRoutingModule } from './registro-articulos.routing';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { OtrosCostosFormComponent } from './otros-costos-form/otros-costos-form.component';

@NgModule({
  declarations: [RegistroArticulosComponent, OtrosCostosFormComponent],
  imports: [CommonModule, ArticulosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, TablasModule, PipesModule, NgxBootstrapModule, DirectivesModule],
})
export class RegistroArticulosModule {}
