import { PrimengModule } from './../../../modules/primeng.module';
import { DirectivesModule } from './../../../core/directive/directives.module';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UploadImgModule } from './../../../admin/components/upload-img/upload-img.module';
import { DropdownModule } from 'primeng/dropdown';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionesRoutingModule } from './configuraciones.routing';
import { ConfiguracionesComponent } from './configuraciones.component';

@NgModule({
  declarations: [ConfiguracionesComponent],
  imports: [CommonModule, ConfiguracionesRoutingModule, FormsModule, ReactiveFormsModule, InputMaskModule, UploadImgModule, DropdownModule, DirectivesModule, MultiSelectModule, PrimengModule],
})
export class ConfiguracionesModule {}
