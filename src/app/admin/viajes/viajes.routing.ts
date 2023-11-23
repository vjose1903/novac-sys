import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'viajes/:id',
    component: ReciboViajesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViajesRoutingModule {}
