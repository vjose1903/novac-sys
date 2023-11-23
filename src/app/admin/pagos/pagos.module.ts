import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PagosComponent } from './pagos-facturas/Formulario/pagos.component';
import { PagosRoutingModule } from './pagos.routing';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../core/directive/directives.module';
import { PrimengModule } from '../../modules/primeng.module';
import { BtnIconModule } from '../components/btn-icon-circular/btn-icon-circular.module';
import { TablasModule } from '../components/new_tablas/tablas.module';
import { DetalleFacturaModule } from '../manipular facturas/detalle-factura/detalle-factura.module';
import { ListaPagosComponent } from './pagos-facturas/lista-pagos/lista-pagos.component';

@NgModule({
  declarations: [PagosComponent, ListaPagosComponent],
  imports: [CommonModule, PagosRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, DirectivesModule, TablasModule, NgxPermissionsModule.forChild(), DetalleFacturaModule, BtnIconModule],
})
export class PagosModule {}
