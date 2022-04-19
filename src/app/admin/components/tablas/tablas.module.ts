import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BTNACCIONESComponent } from './btnacciones/btnacciones.component';
import { TablasComponent } from './tablas.component';
import { FormsModule } from '@angular/forms';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [BTNACCIONESComponent, TablasComponent],
  imports: [CommonModule, FormsModule, NgxBootstrapModule, PrimengModule, NgxPermissionsModule.forChild()],
  exports: [BTNACCIONESComponent, TablasComponent],
})
export class TablasModule {}
