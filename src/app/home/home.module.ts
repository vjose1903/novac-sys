import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { AngularModule } from '../modules/angular.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { MdBootstrapModule } from '../modules/md-bootstrap.module';
import { PrimengModule } from '../modules/primeng.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [PrimengModule, CommonModule, SharedModule, HomeRoutingModule, AngularModule, MDBBootstrapModule, MdBootstrapModule],
})
export class HomeModule {}
