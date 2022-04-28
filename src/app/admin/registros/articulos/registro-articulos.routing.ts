import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { RegistroArticulosComponent } from './registro-articulos.component';
import { Permisos } from '../../../core/typescript/permisos';
// const permisos = ['articulo_create', 'articulo_read_all', 'articulo_read_one', 'articulo_update', 'articulo_destroy', 'articulo_get_stock', 'articulo_get_filtrados', 'articulo_check_excede', 'articulo_read_formula', 'articulo_update_formula'];
const routes: Routes = [
  {
    path: '',
    component: RegistroArticulosComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: Object.values(Permisos.articulo),
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticulosRoutingModule {}
