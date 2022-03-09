import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistroClientesRoutingModule } from './registro-clientes.routing';
import { RegistroClientesComponent } from './registro-clientes.component';
import { UploadImgModule } from '../../components/upload-img/upload-img.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/tablas/tablas.module';

@NgModule({
  declarations: [RegistroClientesComponent],
  imports: [CommonModule, RegistroClientesRoutingModule, UploadImgModule, ReactiveFormsModule, FormsModule, DirectivesModule, PrimengModule, TablasModule],
})
export class RegistroClientesModule {}
