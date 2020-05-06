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
import { RegistroClientesComponent } from './registros/registro-clientes/registro-clientes.component';
import { ValidateRayaAbajo } from '../directives/validaciones';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { RegistroSuplidoresComponent } from './registros/registro-suplidores/registro-suplidores.component';
import { FiltroParaNgforPipe } from '../core/pipe/filtro-para-ngfor.pipe';
import { PaswordConfirmDirective } from '../core/directive/pasword-confirm-directive.directive';
import { ProduccionComponent } from './produccion/produccion.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MovimientosFormComponent } from './inventario/movimientos-form/movimientos-form.component';
import { IngresosComponent } from './ingresos/ingresos.component';
import { FormCantidadEfectivoComponent } from './facturacion/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { BuscarFacturaComponent } from './manipular facturas/buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './manipular facturas/notas-cred-deb/notas-cred-deb.component';
import { NcfComponent } from './mantenimiento/ncf/ncf.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ModalComponent } from './components/modal/modal.component';
import { BTNcircularComponent } from './components/btncircular/btncircular.component';
import { UploadImgComponent } from './components/upload-img/upload-img.component';
import { PendienteFormComponent } from './components/pendiente-form/pendiente-form.component';
import { FormarFacturaComponent } from './components/formar-factura/formar-factura.component';
import { TablasModule } from './components/tablas/tablas.module';
import { ModalHistorialPagosComponent } from './ingresos/modal-historial-pagos/modal-historial-pagos.component';

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
    MovimientosFormComponent,
    IngresosComponent,
    FormCantidadEfectivoComponent,
    BuscarFacturaComponent,
    FormarFacturaComponent,
    NotasCredDebComponent,
    NcfComponent,
    ModalHistorialPagosComponent,
  ],
  imports: [
    DialogModule,
    TablasModule,
    CommonModule,
    AppRoutingModule,
    AngularModule,
    NgxBootstrapModule,
    NgSelectModule,
    FormsModule,
    // MdBootstrapModule
    MDBBootstrapModule.forRoot(),
    NgbModule,
  ],
  exports: [],
})
export class AdminModule {}
