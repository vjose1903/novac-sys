import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { PrimengModule } from '../../modules/primeng.module';
import { ProduccionComponent } from './produccion.component';

const routes: Routes = [
  {
    path: '',
    component: ProduccionComponent,
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  declarations: [ProduccionComponent],
  imports: [CommonModule, FormsModule, PrimengModule, TablasModule, RouterModule.forChild(routes)],
})
export class ProduccionModule {}
