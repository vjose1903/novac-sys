import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BTNACCIONESComponent } from './btnacciones/btnacciones.component';
import { TablasComponent } from './tablas.component';
import { FORMERR } from 'dns';
import { FormsModule } from '@angular/forms';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';

@NgModule({
  declarations: [BTNACCIONESComponent, TablasComponent],
  imports: [CommonModule, FormsModule, MDBBootstrapModule, NgxBootstrapModule],
  exports: [BTNACCIONESComponent, TablasComponent],
})
export class TablasModule {}
