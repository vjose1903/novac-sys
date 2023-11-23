import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';

import { Permisos } from '../../../core/typescript/permisos';
import { BancoComponent } from './banco.component';

const routes: Routes = [
  {
    path: '',
    component: BancoComponent,
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.articulo),
    //   },
    // },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BancoRoutingModule {}
