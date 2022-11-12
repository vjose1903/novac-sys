import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManipularFacturasRoutingModule } from './manipular-facturas.routing';
import { BuscarFacturaComponent } from './buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './notas-cred-deb/notas-cred-deb.component';
import { TablasModule } from '../components/new_tablas/tablas.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';
import { PrimengModule } from '../../modules/primeng.module';
import { DetalleNotaComponent } from './detalle-nota/detalle-nota.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DetalleFacturaModule } from './detalle-factura/detalle-factura.module';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';

@NgModule({
  declarations: [NotasCredDebComponent, BuscarFacturaComponent, DetalleNotaComponent],
  imports: [CommonModule, ManipularFacturasRoutingModule, TablasModule, BtncircularModule, PrimengModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtnIconModule],
})
export class ManipularFacturasModule {}
