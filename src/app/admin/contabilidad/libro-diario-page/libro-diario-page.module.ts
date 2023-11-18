import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibroDiarioPageRoutingModule } from './libro-diario-page.routing';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { BtnIconModule } from '../../components/btn-icon-circular/btn-icon-circular.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LibroDiarioPageComponent } from './libro-diario-page.component';
import { EntradaDiarioComponent } from './entrada-diario/entrada-diario.component';
import { FormEntradaDiarioComponent } from './entrada-diario/form-entrada-diario/form-entrada-diario.component';

@NgModule({
  declarations: [LibroDiarioPageComponent, EntradaDiarioComponent, FormEntradaDiarioComponent],
  imports: [CommonModule, LibroDiarioPageRoutingModule, PipesModule, PrimengModule, BtnIconModule, TablasModule, DirectivesModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild()],
  exports: [FormEntradaDiarioComponent],
})
export class LibroDiarioPageModule {}
