import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BuscarFacturaComponent } from './buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './notas-cred-deb/notas-cred-deb.component';

const routes: Routes = [
  {
    path: 'buscarFactura/:buscarPara',
    component: BuscarFacturaComponent,
  },
  {
    path: 'nota/:tipoNota/:id_factura/:serie',
    component: NotasCredDebComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManipularFacturasRoutingModule {}
