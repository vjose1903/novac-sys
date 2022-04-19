import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ArticulosRoutingModule } from './registro-articulos.routing';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@NgModule({
  declarations: [RegistroArticulosComponent],
  imports: [CommonModule, ArticulosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, TablasModule,NewTablasModule, PipesModule, NgxBootstrapModule, DirectivesModule, OverlayPanelModule],
})
export class RegistroArticulosModule {}
