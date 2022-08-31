import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroClientesRoutingModule } from './registro-clientes.routing';
import { RegistroClientesComponent } from './registro-clientes.component';
import { UploadImgModule } from '../../components/upload-img/upload-img.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TablasModule } from '../../components/new_tablas/tablas.module';

@NgModule({
  declarations: [RegistroClientesComponent],
  imports: [CommonModule, RegistroClientesRoutingModule, UploadImgModule, TablasModule, ReactiveFormsModule, FormsModule, DirectivesModule, PrimengModule, NgxPermissionsModule],
})
export class RegistroClientesModule {}
