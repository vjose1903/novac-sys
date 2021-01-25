import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManipularFacturasRoutingModule } from './manipular-facturas.routing';
import { BuscarFacturaComponent } from './buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './notas-cred-deb/notas-cred-deb.component';
import { AngularModule } from '../../modules/angular.module';
import { TablasModule } from '../components/tablas/tablas.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';

@NgModule({
  declarations: [NotasCredDebComponent, BuscarFacturaComponent],
  imports: [CommonModule, ManipularFacturasRoutingModule, AngularModule, TablasModule, BtncircularModule],
})
export class ManipularFacturasModule {}
