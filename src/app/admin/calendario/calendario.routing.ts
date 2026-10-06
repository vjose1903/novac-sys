import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { CalendarioComponent } from './calendario.component';

const routes: Routes = [
  {
    path: '',
    component: CalendarioComponent,
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarioRoutingModule {}
