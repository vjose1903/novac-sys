import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { Permisos } from '../../../core/typescript/permisos';

const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     // only: Object.values(Permisos.user),
    //     // only: [Permisos.user.create, Permisos.user.read_all, Permisos.user.read_one, Permisos.user.update, Permisos.user.destroy, Permisos.user.get_filtrados],
    //     // only: [Permisos.user.create],
    //     only: [Permisos.user.create],
    //     redirectTo: 'admin/dashboard'
    //   },
    // },

  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroEmpleadosRoutingModule {}
