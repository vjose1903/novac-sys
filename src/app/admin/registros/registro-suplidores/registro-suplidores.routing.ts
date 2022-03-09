import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroSuplidoresComponent } from './registro-suplidores.component';

const routes: Routes = [
  {
    path: '',
    component: RegistroSuplidoresComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroSuplidoresRoutingModule { }
