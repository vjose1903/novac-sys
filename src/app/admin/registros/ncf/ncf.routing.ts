import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NcfComponent } from './ncf.component';
import { Permisos } from '@core/typescript/permisos';
import { PermissionsGuardService } from '@core/guard/permissions.guard';

const routes: Routes = [
  {
    path: '',
    component: NcfComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.secuencia_comprobante), 'admin/dashboard')],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NcfRoutingModule {}
