import { ConduceFormComponent } from './form/conduce-form.component';
import { ConduceListaComponent } from './lista/conduce-lista.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';

const routes: Routes = [
  {
    path: 'lista',
    component: ConduceListaComponent,
    canDeactivate: [CanDeactivateGuard],
  },
  {
    path: 'formulario',
    component: ConduceFormComponent,
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConduceRoutingModule {}
