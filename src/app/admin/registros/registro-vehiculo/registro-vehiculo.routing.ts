import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RegistroVehiculoComponent } from './registro-vehiculo.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
const routes: Routes = [
  {
    path: '',
    component: RegistroVehiculoComponent,
<<<<<<< HEAD
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.vehiculo),
    //   },
    // },
=======
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.vehiculo), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
>>>>>>> dev
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroVehiculoRoutingModule {}
