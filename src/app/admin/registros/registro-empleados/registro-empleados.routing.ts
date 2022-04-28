import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroEmpleadosComponent } from './registro-empleados.component';
import { Permisos } from '../../../core/typescript/permisos';


const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: Object.values(Permisos.user),
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroEmpleadosRoutingModule {}
