import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroClientesComponent } from './registro-clientes.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroClientesComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.cliente), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroClientesRoutingModule {}
