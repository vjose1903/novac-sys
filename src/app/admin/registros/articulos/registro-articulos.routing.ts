import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { Permisos } from '@core/typescript/permisos';

const routes: Routes = [
  {
    path: '',
    component: RegistroArticulosComponent,
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
export class ArticulosRoutingModule {}
