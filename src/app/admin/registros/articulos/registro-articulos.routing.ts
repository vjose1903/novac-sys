import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: RegistroArticulosComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.articulo), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticulosRoutingModule {}
