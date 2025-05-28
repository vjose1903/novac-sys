import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Permisos } from '@core/typescript/permisos';
import { RolesComponent } from './roles.component';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: RolesComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.role), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RolesRoutingModule {}
