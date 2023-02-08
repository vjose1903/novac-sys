import { BtnIconModule } from './../../components/btn-icon-circular/btn-icon-circular.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArticulosRoutingModule } from './registro-articulos.routing';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';

import { NgxPermissionsModule } from 'ngx-permissions';
import { ConfigArticulosComponent } from './configuracion_articulos/config-articulos/config-articulos.component';

@NgModule({
  declarations: [RegistroArticulosComponent, ConfigArticulosComponent],
  imports: [CommonModule, ArticulosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, NgxBootstrapModule, TablasModule, DirectivesModule, NgxPermissionsModule, BtnIconModule],
})
export class RegistroArticulosModule {}
