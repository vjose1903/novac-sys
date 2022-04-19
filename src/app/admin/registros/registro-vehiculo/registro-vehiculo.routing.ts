import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { RegistroVehiculoComponent } from './registro-vehiculo.component';

const permisos = ['vehiculo_create', 'vehiculo_read_all', 'vehiculo_read_one', 'vehiculo_update', 'vehiculo_destroy', 'vehiculo_get_filtrados'];
const routes: Routes = [
  {
    path: '',
    component: RegistroVehiculoComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: permisos,
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroVehiculoRoutingModule {}
