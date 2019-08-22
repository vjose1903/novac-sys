import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';
import { AngularModule } from '../modules/angular.module';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { MdBootstrapModule } from '../modules/md-bootstrap.module';


//componentes
import { HomeAdminComponent } from './home/homeAdmin.component';
import { NavbarAComponent } from './navbar-a/navbar-a.component';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { InventarioComponent } from './inventario/inventario.component';
import { RegistroArticulosComponent } from './registros/articulos/registro-articulos.component';


@NgModule({
  declarations: [
    HomeAdminComponent,
    NavbarAComponent,
    FacturacionComponent,
    InventarioComponent,
    RegistroArticulosComponent  
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
