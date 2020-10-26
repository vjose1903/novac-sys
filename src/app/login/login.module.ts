import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginComponent } from './login.component';
import { SharedModule } from '../shared/shared.module';
import { AngularModule } from '../modules/angular.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { MdBootstrapModule } from '../modules/md-bootstrap.module';
import { PrimengModule } from '../modules/primeng.module';

@NgModule({
  declarations: [LoginComponent],
  imports: [PrimengModule, CommonModule, SharedModule, AngularModule, MDBBootstrapModule, MdBootstrapModule],
})
export class HomeModule {}
