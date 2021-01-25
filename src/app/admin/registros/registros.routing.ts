import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistroArticulosComponent } from './articulos/registro-articulos.component';
import { NcfComponent } from './ncf/ncf.component';
import { RegistroClientesComponent } from './registro-clientes/registro-clientes.component';
import { RegistroEmpleadosComponent } from './registro-empleados/registro-empleados.component';
import { RegistroSuplidoresComponent } from './registro-suplidores/registro-suplidores.component';
import { RegistroVehiculoComponent } from './registro-vehiculo/registro-vehiculo.component';

const routes: Routes = [
  {
    path: 'clientes',
    component: RegistroClientesComponent,
  },
  {
    path: 'suplidores',
    component: RegistroSuplidoresComponent,
  },
  {
    path: 'ncf',
    component: NcfComponent,
  },
  {
    path: 'articulos',
    component: RegistroArticulosComponent,
  },
  {
    path: 'empleados',
    component: RegistroEmpleadosComponent,
  },
  {
    path: 'camiones',
    component: RegistroVehiculoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrosRoutingModule {}
