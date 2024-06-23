import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { SvgBackgroundComponent } from './extra/svg-background/svg-background.component';
import { DirectivesModule } from '../core/directive/directives.module';
@NgModule({
  declarations: [LoginComponent, ModalPasswordConfigComponent, SvgBackgroundComponent],
  imports: [CommonModule, LoginRoutingModule, FormsModule, ReactiveFormsModule, DirectivesModule],
})
export class LoginModule {}
