import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permisos } from '../../../core/typescript/permisos';
import { RolesComponent } from './roles.component';

const routes: Routes = [
  {
    path: '',
    component: RolesComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: Object.values(Permisos.role),
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RolesRoutingModule {}
