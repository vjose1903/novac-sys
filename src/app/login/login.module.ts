import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { DirectivesModule } from '../core/directive/directives.module';
@NgModule({
  declarations: [LoginComponent, ModalPasswordConfigComponent],
  imports: [CommonModule, LoginRoutingModule, FormsModule, ReactiveFormsModule],
})
export class LoginModule {}
