import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { PrimengModule } from '../../modules/primeng.module';
import { InventarioComponent } from './inventario.component';

const routes: Routes = [
  {
    path: '',
    component: InventarioComponent,
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  declarations: [InventarioComponent],
  imports: [CommonModule, FormsModule, PrimengModule, TablasModule, BtnIconModule, RouterModule.forChild(routes)],
})
export class InventarioModule {}
