import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { TabViewModule } from 'primeng/tabview';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../new_tablas/tablas.module';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { FormCantidadEfectivoComponent } from './form-cantidad-efectivo/form-cantidad-efectivo.component';
import { FormReportesComponent } from './form-reportes/form-reportes.component';
import { FormularioMarcaModeloComponent } from './formulario-marca-modelo/formulario-marca-modelo.component';
import { ModalHistorialPagosComponent } from './modal-historial-pagos/modal-historial-pagos.component';
import { ModalSeleccinarArticuloComponent } from './modal-seleccinar-articulo/modal-seleccinar-articulo.component';
import { MovimientosFormComponent } from './movimientos-form/movimientos-form.component';
import { PendienteFormComponent } from './pendiente-form/pendiente-form.component';
import { BuscarClienteSuplidorComponent } from './buscar-cliente-suplidor/buscar-cliente-suplidor.component';
import { BuscarArticuloComponent } from './buscar-articulo/buscar-articulo.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

const components = [
  FormCantidadEfectivoComponent,
  ModalHistorialPagosComponent,
  ChangePasswordComponent,
  FormularioMarcaModeloComponent,
  FormReportesComponent,
  MovimientosFormComponent,
  PendienteFormComponent,
  ModalSeleccinarArticuloComponent,
  BuscarClienteSuplidorComponent,
  BuscarArticuloComponent,
];

@NgModule({
  declarations: components,
  imports: [CommonModule, TablasModule, NgSelectModule, FormsModule, ReactiveFormsModule, PrimengModule, NgxBootstrapModule, TabViewModule, NgxPermissionsModule],
  exports: components,
})
export class FormulariosEnModalesModule {}
