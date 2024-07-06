import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListaPagosComponent } from './pagos-facturas/lista-pagos/lista-pagos.component';
import { PagosComponent } from './pagos-facturas/Formulario/pagos.component';

const routes: Routes = [
  {
    path: 'lista_pagos/:tipo',
    component: ListaPagosComponent,
  },
  {
    path: ':tipo/:entidad_id/:factura_id',
    component: PagosComponent,
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagosRoutingModule {}
