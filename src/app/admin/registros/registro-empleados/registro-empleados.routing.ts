import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
const permisos = ['user_create', 'user_read_all', 'user_read_one', 'user_update', 'user_destroy', 'user_get_filtrados'];
const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
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
export class RegistroEmpleadosRoutingModule {}
