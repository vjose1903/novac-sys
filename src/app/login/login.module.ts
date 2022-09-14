import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { ConfiguracionesComponent } from './extra/configuraciones/configuraciones.component';
import { InputMaskModule } from 'primeng/inputmask';
import { MultiSelectModule } from 'primeng/multiselect';
import { UploadImgModule } from '../admin/components/upload-img/upload-img.module';
import { DropdownModule } from 'primeng/dropdown';
import { DirectivesModule } from '../core/directive/directives.module';
@NgModule({
  declarations: [LoginComponent, ModalPasswordConfigComponent, ConfiguracionesComponent],
  imports: [CommonModule, LoginRoutingModule, NgxBootstrapModule, FormsModule, ReactiveFormsModule, InputMaskModule, UploadImgModule, DropdownModule, DirectivesModule, MultiSelectModule],
})
export class LoginModule {}
