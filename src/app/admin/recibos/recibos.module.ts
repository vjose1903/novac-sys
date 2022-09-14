import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecibosRoutingModule } from './recibos.routing';
import { IngresosComponent } from './recibo-ingresos/Formulario/ingresos.component';

import { ListaRecibosComponent } from './recibo-ingresos/lista-recibos/lista-recibos.component';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { NewTablasModule } from '../components/new_tablas/tablas.module';
import { PrimengModule } from '../../modules/primeng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../core/directive/directives.module';
import { DetalleFacturaModule } from '../manipular facturas/detalle-factura/detalle-factura.module';

@NgModule({
  declarations: [IngresosComponent, ListaRecibosComponent, ReciboViajesComponent],
  imports: [CommonModule, RecibosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, NewTablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule],
})
export class RecibosModule {}
