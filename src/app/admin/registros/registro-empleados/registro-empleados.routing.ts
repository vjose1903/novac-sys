import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
<<<<<<< HEAD
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

=======
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.user), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
>>>>>>> dev
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroEmpleadosRoutingModule {}
