import { PrimengModule } from './../../../modules/primeng.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
<<<<<<< HEAD
import { ImgViewerEditModule } from '../../../admin/components/img-viewer-edit/img-viewer-edit.module';
import { DropdownModule } from 'primeng/dropdown';
=======
import { UploadImgModule } from '@components/upload-img/upload-img.module';
import { SelectModule } from 'primeng/select';

>>>>>>> dev
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionesRoutingModule } from './configuraciones.routing';
import { ConfiguracionesComponent } from './configuraciones.component';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';

@NgModule({
  declarations: [ConfiguracionesComponent],
<<<<<<< HEAD
  imports: [CommonModule, ConfiguracionesRoutingModule, FormsModule, ReactiveFormsModule, InputMaskModule, ImgViewerEditModule, DropdownModule, DirectivesModule, MultiSelectModule, PrimengModule],
=======
  imports: [CommonModule, ConfiguracionesRoutingModule, FormsModule, ReactiveFormsModule, InputMaskModule, UploadImgModule, SelectModule, DirectivesModule, MultiSelectModule, PrimengModule, FormErrorMsgComponent],
>>>>>>> dev
})
export class ConfiguracionesModule {}
