import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { PrimengModule } from '../../modules/primeng.module';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { DashboardFullscreenCardComponent } from './dashboard-fullscreen-card.component';
import { HomeAdminComponent } from './homeAdmin.component';

const routes: Routes = [
  {
    path: '',
    component: HomeAdminComponent,
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  declarations: [HomeAdminComponent, DashboardFullscreenCardComponent],
  imports: [CommonModule, FormsModule, PrimengModule, RouterModule.forChild(routes), NgxEchartsModule.forRoot({ echarts })],
})
export class HomeModule {}
