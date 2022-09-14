import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetalleFacturaComponent } from './detalle-factura.component';
import { PrimengModule } from '../../../modules/primeng.module';

@NgModule({
  declarations: [DetalleFacturaComponent],
  imports: [CommonModule, PrimengModule],
  exports: [DetalleFacturaComponent],
})
export class DetalleFacturaModule {}
