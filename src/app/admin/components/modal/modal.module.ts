import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularModule } from '../../../modules/angular.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../tablas/tablas.module';
import { ModalComponent } from './modal.component';
import { FormulariosEnModalesModule } from '../formularios en modales/formularios-en-modales.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@NgModule({
  declarations: [ModalComponent],
  imports: [
    CommonModule, FormulariosEnModalesModule, AngularModule, PrimengModule, TablasModule, NgxBootstrapModule, NgxExtendedPdfViewerModule,
    
  ],
  exports: [ModalComponent],
})
export class ModalModule {}
