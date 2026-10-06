import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FacturasRecibidasComponent } from './facturas-recibidas/facturas-recibidas.component';
import { AprobacionesComercialesRecibidasComponent } from './aprobaciones-comerciales-recibidas/aprobaciones-comerciales-recibidas.component';

const routes: Routes = [
  { path: 'ecf_received', component: FacturasRecibidasComponent },
  { path: 'commertial_approval_received', component: AprobacionesComercialesRecibidasComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FacturacionElectronicaRoutingModule {}
