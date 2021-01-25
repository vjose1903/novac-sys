import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RecibosRoutingModule } from './recibos.routing';
import { IngresosComponent } from './recibo-ingresos/Formulario/ingresos.component';

import { ListaRecibosComponent } from './recibo-ingresos/lista-recibos/lista-recibos.component';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';

import { MDBBootstrapModule } from 'angular-bootstrap-md';

import { TablasModule } from '../components/tablas/tablas.module';
import { AngularModule } from '../../modules/angular.module';
import { PrimengModule } from '../../modules/primeng.module';

@NgModule({
  declarations: [IngresosComponent, ListaRecibosComponent, ReciboViajesComponent],
  imports: [CommonModule, RecibosRoutingModule, AngularModule, MDBBootstrapModule, PrimengModule, TablasModule],
})
export class RecibosModule {}
