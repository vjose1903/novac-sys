import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { ListaPagosComponent } from './pagos-facturas/lista-pagos/lista-pagos.component';
import { IngresosComponent } from './pagos-facturas/Formulario/ingresos.component';

const routes: Routes = [
  {
    path: 'lista_pagos/:tipo',
    component: ListaPagosComponent,
  },
  {
    path: 'ingresos/:entidad_id/:factura_id',
    component: IngresosComponent,
  },
  {
    path: 'viajes/:id',
    component: ReciboViajesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecibosRoutingModule {}
