import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';
import { Permisos } from '../../../core/typescript/permisos';

// const permisos = ['suplidor_create', 'suplidor_read_all', 'suplidor_read_one', 'suplidor_update', 'suplidor_destroy', 'suplidor_get_nombres_suplidores', 'suplidor_get_filtrados'];
const routes: Routes = [
  {
    path: '',
    component: RegistroSuplidoresComponent,
    // canActivate: [NgxPermissionsGuard],
    // data: {
    //   permissions: {
    //     only: Object.values(Permisos.suplidor),
    //   },
    // },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroSuplidoresRoutingModule {}
