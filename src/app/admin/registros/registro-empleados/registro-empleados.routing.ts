import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.user), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroEmpleadosRoutingModule {}
