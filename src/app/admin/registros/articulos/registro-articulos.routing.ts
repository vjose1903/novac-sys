import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroArticulosComponent } from './registro-articulos.component';

const routes: Routes = [
  {
    path: '',
    component: RegistroArticulosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ArticulosRoutingModule {}
