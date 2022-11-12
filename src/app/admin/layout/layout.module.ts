import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout.routing';
import { LayoutComponent } from './layout.component';
import { PrimengModule } from '../../modules/primeng.module';
import { NgSelectModule } from '@ng-select/ng-select';

import { DirectivesModule } from '../../core/directive/directives.module';
import { ValidateRayaAbajo } from '../../directives/validaciones';
import { NgxBootstrapModule } from '../../modules/ngx-bootstrap.module';
import { TablasModule } from '../components/new_tablas/tablas.module';

import { HomeAdminComponent } from '../home/homeAdmin.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProduccionComponent } from '../produccion/produccion.component';
import { TabViewModule } from 'primeng/tabview';
import { ReportesComponent } from '../reportes/reportes.component';
import { PdfViewerModule } from '../../admin/components/pdf-viewer/pdf-viewer.module';
import { NgxPermissionsModule } from 'ngx-permissions';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';

@NgModule({
  declarations: [LayoutComponent, HomeAdminComponent, InventarioComponent, ValidateRayaAbajo, ProduccionComponent, ReportesComponent],
  imports: [CommonModule, LayoutRoutingModule, PrimengModule, TablasModule, TabViewModule, NgxBootstrapModule, NgSelectModule, FormsModule, DirectivesModule, PdfViewerModule, ReactiveFormsModule, NgxPermissionsModule.forChild(), BtnIconModule],
})
export class LayoutModule {}
