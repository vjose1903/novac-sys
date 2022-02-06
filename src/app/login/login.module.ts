import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { AngularModule } from '../modules/angular.module';
import { ModalModule } from '../admin/components/modal/modal.module';
import { ModalPasswordConfigComponent } from './extra/modal-password-config/modal-password-config.component';
import { ConfiguracionesComponent } from './extra/configuraciones/configuraciones.component';

@NgModule({
  declarations: [LoginComponent, ModalPasswordConfigComponent, ConfiguracionesComponent],
  imports: [CommonModule, LoginRoutingModule, MDBBootstrapModule, NgxBootstrapModule, AngularModule, ModalModule],
})
export class LoginModule {}
