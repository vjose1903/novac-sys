import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegistrosRoutingModule } from './registros.routing';
import { RegistroArticulosComponent } from './articulos/registro-articulos.component';
import { RegistroClientesComponent } from './registro-clientes/registro-clientes.component';
import { RegistroEmpleadosComponent } from './registro-empleados/registro-empleados.component';
import { RegistroSuplidoresComponent } from './registro-suplidores/registro-suplidores.component';
import { RegistroVehiculoComponent } from './registro-vehiculo/registro-vehiculo.component';
import { NcfComponent } from './ncf/ncf.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../modules/primeng.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { TablasModule } from '../components/tablas/tablas.module';
import { UploadImgModule } from '../components/upload-img/upload-img.module';
import { AngularModule } from '../../modules/angular.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgxBootstrapModule } from '../../modules/ngx-bootstrap.module';
import { DirectivesModule } from '../../core/directive/directives.module';
import { PipesModule } from '../../core/pipe/pipes.module';

@NgModule({
  declarations: [RegistroArticulosComponent, RegistroClientesComponent, RegistroEmpleadosComponent, RegistroSuplidoresComponent, RegistroVehiculoComponent, NcfComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    PrimengModule,
    RegistrosRoutingModule,
    TablasModule,
    UploadImgModule,
    AngularModule,
    MDBBootstrapModule,
    NgxBootstrapModule,
    DirectivesModule,
    PipesModule,
  ],
})
export class RegistrosModule {}
