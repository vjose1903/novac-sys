import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecibosRoutingModule } from './recibos.routing';
import { IngresosComponent } from './pagos-facturas/Formulario/ingresos.component';

import { ListaPagosComponent } from './pagos-facturas/lista-pagos/lista-pagos.component';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { TablasModule } from '../components/new_tablas/tablas.module';
import { PrimengModule } from '../../modules/primeng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../core/directive/directives.module';
import { DetalleFacturaModule } from '../manipular facturas/detalle-factura/detalle-factura.module';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';

@NgModule({
  declarations: [IngresosComponent, ListaPagosComponent, ReciboViajesComponent],
  imports: [CommonModule, RecibosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, TablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtnIconModule],
})
export class PagosModule {}
