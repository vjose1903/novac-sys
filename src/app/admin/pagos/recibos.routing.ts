import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { ListaPagosComponent } from './pagos-facturas/lista-pagos/lista-pagos.component';
import { PagosComponent } from './pagos-facturas/Formulario/pagos.component';

const routes: Routes = [
  {
    path: 'lista_pagos/:tipo',
    component: ListaPagosComponent,
  },
  {
    path: 'pagos/:tipo/:entidad_id/:factura_id',
    component: PagosComponent,
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
