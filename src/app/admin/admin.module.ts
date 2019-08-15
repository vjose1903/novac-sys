import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeAdminComponent } from './home/homeAdmin.component';
import { NavbarAComponent } from './navbar-a/navbar-a.component';
import { AppRoutingModule } from '../app-routing.module';
import { AngularModule } from '../modules/angular.module';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';

@NgModule({
  declarations: [
    HomeAdminComponent,
    NavbarAComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    AngularModule,
    NgxBootstrapModule
    
  ],
  exports:[
  ]
})
export class AdminModule { }
