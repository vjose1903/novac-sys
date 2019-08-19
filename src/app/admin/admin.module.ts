import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeAdminComponent } from './home/homeAdmin.component';
import { NavbarAComponent } from './navbar-a/navbar-a.component';
import { AppRoutingModule } from '../app-routing.module';
import { AngularModule } from '../modules/angular.module';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { InventarioComponent } from './inventario/inventario.component';
import { RegistrosComponent } from './registros/registros.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { MdBootstrapModule } from '../modules/md-bootstrap.module';

@NgModule({
  declarations: [
    HomeAdminComponent,
    NavbarAComponent,
    FacturacionComponent,
    InventarioComponent,
    RegistrosComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    AngularModule,
    NgxBootstrapModule,
     MdBootstrapModule,
    
  ],
  exports:[
  ]
})
export class AdminModule { }
