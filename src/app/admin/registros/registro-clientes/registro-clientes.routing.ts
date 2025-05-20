import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroClientesComponent } from './registro-clientes.component';
import { Permisos } from '@core/typescript/permisos';

// const permisos = ['cliente_create', 'cliente_read_all', 'cliente_read_one', 'cliente_update', 'cliente_destroy', 'cliente_get_filtrados'];
const routes: Routes = [
  {
    path: '',
    component: RegistroClientesComponent,
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.cliente),
    //   },
    // },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroClientesRoutingModule {}
