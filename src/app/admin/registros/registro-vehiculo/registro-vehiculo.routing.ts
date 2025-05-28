import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RegistroVehiculoComponent } from './registro-vehiculo.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
const routes: Routes = [
  {
    path: '',
    component: RegistroVehiculoComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.vehiculo), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroVehiculoRoutingModule {}
