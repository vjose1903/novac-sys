import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroSuplidoresComponent,
<<<<<<< HEAD
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.suplidor),
    //   },
    // },
=======
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.suplidor), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
>>>>>>> dev
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroSuplidoresRoutingModule {}
