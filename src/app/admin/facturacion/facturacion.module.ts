import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturacionComponent } from './facturacion.component';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { RemoverArticuloComponent } from './cuerpo-factura/remover-articulo/remover-articulo.component';
import { FacturacionRoutingModule } from './facturacion.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../core/directive/directives.module';
import { PrimengModule } from '../../modules/primeng.module';
import { NewTablasModule } from '../components/new_tablas/tablas.module';
import { DetalleFacturaModule } from '../manipular facturas/detalle-factura/detalle-factura.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';
import { NgxBootstrapModule } from '../../modules/ngx-bootstrap.module';

@NgModule({
  declarations: [FacturacionComponent, CuerpoFacturaComponent, RemoverArticuloComponent],
  imports: [CommonModule, FacturacionRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, NewTablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtncircularModule, NgxBootstrapModule],
})
export class FacturacionModule {}
