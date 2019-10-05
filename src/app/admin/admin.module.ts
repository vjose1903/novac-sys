import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../app-routing.module';
import { AngularModule } from '../modules/angular.module';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { DialogModule } from 'primeng/dialog';

// componentes
import { HomeAdminComponent } from './home/homeAdmin.component';
import { NavbarAComponent } from './navbar-a/navbar-a.component';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { InventarioComponent } from './inventario/inventario.component';
import { RegistroArticulosComponent } from './registros/articulos/registro-articulos.component';
import { RegistroEmpleadosComponent } from './registros/registro-empleados/registro-empleados.component';
import { CuerpoFacturaComponent } from './facturacion/cuerpo-factura/cuerpo-factura.component';
import { TablasModule } from '../components/tablas/tablas.module';
import { ModalComponent } from '../components/modal/modal.component';

@NgModule({
  declarations: [
    HomeAdminComponent,
    ModalComponent,
    NavbarAComponent,
    FacturacionComponent,
    InventarioComponent,
    RegistroArticulosComponent,
    RegistroEmpleadosComponent,
    CuerpoFacturaComponent,
  ],
  imports: [
    DialogModule,
    TablasModule,
    CommonModule,
    AppRoutingModule,
    AngularModule,
    NgxBootstrapModule,
    // MdBootstrapModule
    MDBBootstrapModule.forRoot(),
  ],
  exports: [],
})
export class AdminModule {}
