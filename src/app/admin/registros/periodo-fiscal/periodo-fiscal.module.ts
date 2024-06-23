import { BtnIconModule } from '../../components/btn-icon-circular/btn-icon-circular.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PeriodoFiscalRoutingModule } from './registro-periodo-fiscal.routing';
import { PeriodoFiscalComponent } from './periodo-fiscal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrimengModule } from '../../../modules/primeng.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { CierreMensualComponent } from './cierre-mensual/cierre-mensual.component';

@NgModule({
  declarations: [PeriodoFiscalComponent, CierreMensualComponent],
  imports: [CommonModule, PeriodoFiscalRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, TablasModule, DirectivesModule, NgxPermissionsModule.forChild(), BtnIconModule],
})
export class PeriodoFiscalModule {}
