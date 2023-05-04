import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContabilidadRoutingModule } from './contabilidad.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [],
  imports: [CommonModule, ContabilidadRoutingModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild()],
})
export class ContabilidadModule {}
