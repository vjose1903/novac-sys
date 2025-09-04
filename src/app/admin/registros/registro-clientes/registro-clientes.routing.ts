import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroClientesComponent } from './registro-clientes.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroClientesComponent,
<<<<<<< HEAD
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.cliente),
    //   },
    // },
=======
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.cliente), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
>>>>>>> dev
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroClientesRoutingModule {}
