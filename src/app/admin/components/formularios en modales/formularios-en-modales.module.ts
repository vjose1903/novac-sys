import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormCantidadEfectivoComponent } from './form-cantidad-efectivo/form-cantidad-efectivo.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { FormarFacturaComponent } from './formar-factura/formar-factura.component';
import { FormularioMarcaModeloComponent } from './formulario-marca-modelo/formulario-marca-modelo.component';
import { ModalHistorialPagosComponent } from './modal-historial-pagos/modal-historial-pagos.component';
import { MovimientosFormComponent } from './movimientos-form/movimientos-form.component';
import { PendienteFormComponent } from './pendiente-form/pendiente-form.component';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablasModule } from '../tablas/tablas.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { AngularModule } from '../../../modules/angular.module';
import { PrimengModule } from '../../../modules/primeng.module';

import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { ModalSeleccinarArticuloComponent } from './modal-seleccinar-articulo/modal-seleccinar-articulo.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormVentasComponent } from './form-reportes/form-reportes.component';

const components = [
  FormCantidadEfectivoComponent,
  ModalHistorialPagosComponent,
  FormarFacturaComponent,
  ChangePasswordComponent,
  FormularioMarcaModeloComponent,
  FormVentasComponent,
  MovimientosFormComponent,
  PendienteFormComponent,
  ModalSeleccinarArticuloComponent,
];

@NgModule({
  declarations: components,
  imports: [CommonModule, FormsModule, NgSelectModule, TablasModule, MDBBootstrapModule, AngularModule, PrimengModule, NgxBootstrapModule, NgbModule],
  exports: components,
})
export class FormulariosEnModalesModule {}
