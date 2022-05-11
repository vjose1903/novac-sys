import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { NcfComponent } from './ncf.component';
import { Permisos } from '../../../core/typescript/permisos';

// const permisos = ['nota_create', 'nota_read_all', 'nota_read_one', 'nota_update', 'nota_cancelar_nota', 'nota_get_filtrados'];

const routes: Routes = [
  {
    path: '',
    component: NcfComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: Object.values(Permisos.secuencia_comprobante),
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NcfRoutingModule {}
