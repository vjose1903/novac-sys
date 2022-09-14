import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistrosRoutingModule } from './registros.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RegistrosRoutingModule, NgxPermissionsModule.forChild()],
})
export class RegistrosModule {}
