import { ConduceFormComponent } from './form/conduce-form.component';
import { ConduceListaComponent } from './lista/conduce-lista.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'lista',
    component: ConduceListaComponent,
  },
  {
    path: 'formulario',
    component: ConduceFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConduceRoutingModule {}
