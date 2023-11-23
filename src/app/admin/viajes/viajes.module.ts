import { PrimengModule } from './../../modules/primeng.module';
import { DirectivesModule } from './../../core/directive/directives.module';
import { TablasModule } from './../components/new_tablas/tablas.module';
import { DetalleFacturaModule } from './../manipular facturas/detalle-factura/detalle-factura.module';
import { BtnIconModule } from './../components/btn-icon-circular/btn-icon-circular.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ViajesRoutingModule } from './viajes.routing';

import { NgxPermissionsModule } from 'ngx-permissions';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';

@NgModule({
  declarations: [ReciboViajesComponent],
  imports: [CommonModule, ViajesRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, TablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtnIconModule],
})
export class ViajesModule {}
