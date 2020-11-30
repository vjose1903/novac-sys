import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AngularModule } from '../modules/angular.module';
import { NgxBootstrapModule } from '../modules/ngx-bootstrap.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';

// componentes
import { HomeAdminComponent } from './home/homeAdmin.component';
import { NavbarAComponent } from './layout/layout.component';

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
import { MovimientosFormComponent } from './components/formularios en modales/movimientos-form/movimientos-form.component';
import { IngresosComponent } from './recibo-ingresos/ingresos.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { BuscarFacturaComponent } from './manipular facturas/buscar-factura/buscar-factura.component';
import { NotasCredDebComponent } from './manipular facturas/notas-cred-deb/notas-cred-deb.component';
import { NcfComponent } from './registros/ncf/ncf.component';

import { ModalComponent } from './components/modal/modal.component';
import { BTNcircularComponent } from './components/btncircular/btncircular.component';
import { UploadImgComponent } from './components/upload-img/upload-img.component';

import { TablasModule } from './components/tablas/tablas.module';
import { ModalHistorialPagosComponent } from './recibo-ingresos/modal-historial-pagos/modal-historial-pagos.component';
import { ConduceComponent } from './conduce/conduce.component';
import { ModalSeleccinarArticuloComponent } from './conduce/modal-seleccinar-articulo/modal-seleccinar-articulo.component';
import { NgInitDirective } from '../directives/ngInit';
import { ReciboViajesComponent } from './recibo-viajes/recibo-viajes.component';
import { PrimengModule } from '../modules/primeng.module';
import { AppRoutingModule } from '../app.routing';
import { ReportesComponent } from './reportes/reportes.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { RegistroVehiculoComponent } from './registros/registro-vehiculo/registro-vehiculo.component';
import { ChangePasswordComponent } from './components/formularios en modales/change-password/change-password.component';
import { FormarFacturaComponent } from './components/formularios en modales/formar-factura/formar-factura.component';
import { FormularioMarcaModeloComponent } from './components/formularios en modales/formulario-marca-modelo/formulario-marca-modelo.component';
import { PendienteFormComponent } from './components/formularios en modales/pendiente-form/pendiente-form.component';
import { FormCantidadEfectivoComponent } from './facturacion/form-cantidad-efectivo/form-cantidad-efectivo.component';
import { FormVentasComponent } from './reportes/form-ventas/form-ventas.component';

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
    RegistroVehiculoComponent,
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
    ConduceComponent,
    ModalSeleccinarArticuloComponent,
    ReciboViajesComponent,
    ReportesComponent,
    FormularioMarcaModeloComponent,
    FormVentasComponent,
  ],
  imports: [
    PrimengModule,
    TablasModule,
    CommonModule,
    PdfViewerModule,
    NgxExtendedPdfViewerModule,
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
