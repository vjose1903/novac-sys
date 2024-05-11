import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturacionComponent } from './facturacion.component';
import { MenuOpcionesExtraComponent } from './menu-opciones-extra/menu-opciones-extra.component';
import { CuerpoFacturaComponent } from './cuerpo-factura/cuerpo-factura.component';
import { RemoverArticuloComponent } from './cuerpo-factura/remover-articulo/remover-articulo.component';
import { FacturacionRoutingModule } from './facturacion.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../core/directive/directives.module';
import { PrimengModule } from '../../modules/primeng.module';
import { TablasModule } from '../components/new_tablas/tablas.module';
import { DetalleFacturaModule } from '../manipular facturas/detalle-factura/detalle-factura.module';
import { BtncircularModule } from '../components/btncircular/btncircular.module';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';
import { RetornarDevueltoComponent } from './cuerpo-factura/retornar-devuelto/retornar-devuelto.component';

@NgModule({
  declarations: [FacturacionComponent, CuerpoFacturaComponent, RemoverArticuloComponent, MenuOpcionesExtraComponent, RetornarDevueltoComponent],
  imports: [CommonModule, FacturacionRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, TablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtncircularModule,  BtnIconModule],
})
export class FacturacionModule {}
