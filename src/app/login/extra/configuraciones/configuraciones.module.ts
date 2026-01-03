import { PrimengModule } from './../../../modules/primeng.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMaskModule } from 'primeng/inputmask';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ImgViewerEditModule } from '@core/components/img-viewer-edit/img-viewer-edit.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionesRoutingModule } from './configuraciones.routing';
import { ConfiguracionesComponent } from './configuraciones.component';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';

@NgModule({
  declarations: [ConfiguracionesComponent],
  imports: [CommonModule, ConfiguracionesRoutingModule, FormsModule, ReactiveFormsModule, InputMaskModule, ImgViewerEditModule, SelectModule, DirectivesModule, MultiSelectModule, PrimengModule, FormErrorMsgComponent],
})
export class ConfiguracionesModule {}
