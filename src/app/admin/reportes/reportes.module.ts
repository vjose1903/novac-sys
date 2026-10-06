import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsModule } from 'ngx-permissions';
import { PermissionsGuardService } from '@core/guard/permissions.guard';
import { CanDeactivateGuard } from '@core/guard/can-deactivate.guard';
import { Permisos } from '@core/typescript/permisos';
import { ReportesComponent } from './reportes.component';

const routes: Routes = [
  {
    path: '',
    component: ReportesComponent,
    canActivate: [PermissionsGuardService.createPermissionGuard(Object.values(Permisos.reporte), 'admin/dashboard')],
    canDeactivate: [CanDeactivateGuard],
  },
];

@NgModule({
  declarations: [ReportesComponent],
  imports: [CommonModule, NgxPermissionsModule.forChild(), RouterModule.forChild(routes)],
})
export class ReportesModule {}
