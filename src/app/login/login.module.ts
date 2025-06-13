import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DirectivesModule } from '@core/directive/directives.module';
import { FormErrorMsgComponent } from '@core/components/form-error-msg/form-error-msg.component';
@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, LoginRoutingModule, FormsModule, ReactiveFormsModule, DirectivesModule, FormErrorMsgComponent],
})
export class LoginModule {}
