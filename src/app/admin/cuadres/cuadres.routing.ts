import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { Permisos } from '@core/typescript/permisos';
import { CuadresComponent } from './cuadres.component';

const routes: Routes = [
  {
    path: '',
    component: CuadresComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.cuadre_caja), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuadresRoutingModule {}
