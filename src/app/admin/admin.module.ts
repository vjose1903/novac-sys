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

import { InventarioComponent } from './inventario/inventario.component';
import { RegistroArticulosComponent } from './registros/articulos/registro-articulos.component';
import { RegistroEmpleadosComponent } from './registros/registro-empleados/registro-empleados.component';
import { CuerpoFacturaComponent } from './facturacion/cuerpo-factura/cuerpo-factura.component';
import { TablasModule } from '../components/tablas/tablas.module';
import { ModalComponent } from '../components/modal/modal.component';
import { BTNcircularComponent } from '../components/btncircular/btncircular.component';
import { RegistroClientesComponent } from './registros/registro-clientes/registro-clientes.component';
import { UploadImgComponent } from '../components/upload-img/upload-img.component';
import { ValidateRayaAbajo } from '../directives/validaciones';

import { FacturacionComponent } from './facturacion/facturacion.component';
import { RegistroSuplidoresComponent } from './registros/registro-suplidores/registro-suplidores.component';
import { FiltroParaNgforPipe } from '../core/pipe/filtro-para-ngfor.pipe';
import { PaswordConfirmDirective } from '../core/directive/pasword-confirm-directive.directive';
import { ChangePasswordComponent } from '../components/change-password/change-password.component';
import { ProduccionComponent } from './produccion/produccion.component';
import { PendienteFormComponent } from '../components/pendiente-form/pendiente-form.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    ChangePasswordComponent,
    PaswordConfirmDirective,
    HomeAdminComponent,
    ModalComponent,
    FiltroParaNgforPipe,
    NavbarAComponent,
    FacturacionComponent,
    InventarioComponent,
    RegistroArticulosComponent,
    RegistroEmpleadosComponent,
    CuerpoFacturaComponent,
    BTNcircularComponent,
    RegistroClientesComponent,
    UploadImgComponent,
    ValidateRayaAbajo,
    RegistroSuplidoresComponent,
    ProduccionComponent,
    PendienteFormComponent,
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
    NgbModule,
  ],
  exports: [],
})
export class AdminModule {}
