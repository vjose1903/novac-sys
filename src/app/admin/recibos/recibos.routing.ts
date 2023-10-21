import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IngresosComponent } from './recibo-ingresos/Formulario/ingresos.component';
import { ListaRecibosComponent } from './recibo-ingresos/lista-recibos/lista-recibos.component';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';

const routes: Routes = [
  {
    path: 'lista_ingresos/:tipo',
    component: ListaRecibosComponent,
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
