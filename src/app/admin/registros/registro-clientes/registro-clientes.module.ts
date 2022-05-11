import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroClientesRoutingModule } from './registro-clientes.routing';
import { RegistroClientesComponent } from './registro-clientes.component';
import { UploadImgModule } from '../../components/upload-img/upload-img.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';

@NgModule({
  declarations: [RegistroClientesComponent],
  // TODO: ver si falta el forChild en libreria de permisos
  imports: [CommonModule, RegistroClientesRoutingModule, UploadImgModule, NewTablasModule, ReactiveFormsModule, FormsModule, DirectivesModule, PrimengModule, TablasModule, NgxPermissionsModule],
})
export class RegistroClientesModule {}
