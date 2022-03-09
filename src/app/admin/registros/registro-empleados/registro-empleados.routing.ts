import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroEmpleadosComponent } from './registro-empleados.component';

const routes: Routes = [
  {
    path: '',
    component: RegistroEmpleadosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroEmpleadosRoutingModule { }
