import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'clientes', loadChildren: () => import('./registro-clientes/registro-clientes.module').then((m) => m.RegistroClientesModule) },
  { path: 'suplidores', loadChildren: () => import('./registro-suplidores/registro-suplidores.module').then((m) => m.RegistroSuplidoresModule) },
  { path: 'ncf', loadChildren: () => import('./ncf/ncf.module').then((m) => m.NcfModule) },
  { path: 'articulos', loadChildren: () => import('./articulos/registro-articulos.module').then((m) => m.RegistroArticulosModule) },
  { path: 'empleados', loadChildren: () => import('./registro-empleados/registro-empleados.module').then((m) => m.RegistroEmpleadosModule) },
  { path: 'camiones', loadChildren: () => import('./registro-vehiculo/registro-vehiculo.module').then((m) => m.RegistroVehiculoModule) },
  { path: 'roles', loadChildren: () => import('./roles/roles.module').then((m) => m.RolesModule) },
  { path: 'periodo_fiscal', loadChildren: () => import('./periodo-fiscal/periodo-fiscal.module').then((m) => m.PeriodoFiscalModule) },
  { path: 'divisa', loadChildren: () => import('./divisa/divisa.module').then((m) => m.DivisaModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrosRoutingModule {}
