import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout.routing';
import { LayoutComponent } from './layout.component';
import { AngularModule } from '../../modules/angular.module';
import { PrimengModule } from '../../modules/primeng.module';
import { ModalModule } from '../components/modal/modal.module';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { DirectivesModule } from '../../core/directive/directives.module';
import { ValidateRayaAbajo } from '../../directives/validaciones';
import { NgxBootstrapModule } from '../../modules/ngx-bootstrap.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';
import { TablasModule } from '../components/tablas/tablas.module';
import { ConduceComponent } from '../conduce/conduce.component';
import { CuerpoFacturaComponent } from '../facturacion/cuerpo-factura/cuerpo-factura.component';
import { FacturacionComponent } from '../facturacion/facturacion.component';
import { HomeAdminComponent } from '../home/homeAdmin.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProduccionComponent } from '../produccion/produccion.component';
import { TabViewModule } from 'primeng/tabview';
import { ReportesComponent } from '../reportes/reportes.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PdfViewerModule } from '../../admin/components/pdf-viewer/pdf-viewer.module';

@NgModule({
  declarations: [LayoutComponent, HomeAdminComponent, FacturacionComponent, InventarioComponent, CuerpoFacturaComponent, ValidateRayaAbajo, ProduccionComponent, ConduceComponent, ReportesComponent],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    PrimengModule,
    TablasModule,
    CommonModule,
    TabViewModule,
    AngularModule,
    OverlayPanelModule,
    BtncircularModule,
    NgxBootstrapModule,
    NgSelectModule,
    FormsModule,
    ModalModule,
    MDBBootstrapModule.forRoot(),
    NgbModule,
    DirectivesModule,
    PdfViewerModule,
  ],
})
export class LayoutModule {}
