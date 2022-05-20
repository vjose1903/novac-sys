import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArticulosRoutingModule } from './registro-articulos.routing';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [RegistroArticulosComponent],
  imports: [CommonModule, ArticulosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, NgxBootstrapModule, NewTablasModule, DirectivesModule, OverlayPanelModule, NgxPermissionsModule],
})

export class RegistroArticulosModule {}
