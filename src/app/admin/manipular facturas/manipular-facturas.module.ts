import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManipularFacturasRoutingModule } from './manipular-facturas.routing';
import { BuscarFacturaComponent } from './buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './notas-cred-deb/notas-cred-deb.component';
import { AngularModule } from '../../modules/angular.module';
import { TablasModule } from '../components/tablas/tablas.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';

import { PrimengModule } from '../../modules/primeng.module';
import { DetalleNotaComponent } from './detalle-nota/detalle-nota.component';

@NgModule({
  declarations: [NotasCredDebComponent, BuscarFacturaComponent, DetalleNotaComponent],
  imports: [CommonModule, ManipularFacturasRoutingModule, AngularModule, TablasModule, BtncircularModule, PrimengModule],
})
export class ManipularFacturasModule {}
