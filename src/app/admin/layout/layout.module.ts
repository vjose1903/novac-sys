import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout.routing';
import { LayoutComponent } from './layout.component';
import { PrimengModule } from '../../modules/primeng.module';

import { DirectivesModule } from '@core/directive/directives.module';
import { ValidateRayaAbajo } from '../../directives/validaciones';
import { TablasModule } from '@components/new_tablas/tablas.module';

import { HomeAdminComponent } from '../home/homeAdmin.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProduccionComponent } from '../produccion/produccion.component';
import { TabsModule } from 'primeng/tabs';
import { ReportesComponent } from '../reportes/reportes.component';
import { PdfViewerModule } from '@components/pdf-viewer/pdf-viewer.module';
import { NgxPermissionsModule } from 'ngx-permissions';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';

@NgModule({
  declarations: [LayoutComponent, HomeAdminComponent, InventarioComponent, ValidateRayaAbajo, ProduccionComponent, ReportesComponent],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    PrimengModule,
    TablasModule,
    TabsModule,
    FormsModule,
    DirectivesModule,
    PdfViewerModule,
    ReactiveFormsModule,
    NgxPermissionsModule.forChild(),
    BtnIconModule,
    NgxExtendedPdfViewerModule,
  ],
})
export class LayoutModule {}
