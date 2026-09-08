import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NgxPermissionsGuard } from 'ngx-permissions';

import { Permisos } from '../../../core/typescript/permisos';
import { DivisaComponent } from './divisa.component';

const routes: Routes = [
  {
    path: '',
    component: DivisaComponent,
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.periodo_fiscal),
    //   },
    // },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DivisaRoutingModule {}
