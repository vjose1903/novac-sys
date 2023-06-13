import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { DirectivesModule } from '../core/directive/directives.module';
import { SvgBackgroundComponent } from './extra/svg-background/svg-background.component';
@NgModule({
  declarations: [LoginComponent, ModalPasswordConfigComponent, SvgBackgroundComponent],
  imports: [CommonModule, LoginRoutingModule, NgxBootstrapModule, FormsModule, ReactiveFormsModule],
})
export class LoginModule {}
