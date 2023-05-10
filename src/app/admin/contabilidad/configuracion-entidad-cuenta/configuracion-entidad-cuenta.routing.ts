import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfiguracionEntidadCuentaComponent } from './configuracion-entidad-cuenta.component';

const routes: Routes = [{ path: '', component: ConfiguracionEntidadCuentaComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfiguracionEntidadCuentaRoutingModule {}
