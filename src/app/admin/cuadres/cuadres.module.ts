import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { PrimengModule } from '../../modules/primeng.module';
import { FormDivisaInputModule } from '@core/components/form-fields/form-divisa-input/form-divisa-input.module';
import { CuadreDenominationInputComponent } from './components/cuadre-denomination-input/cuadre-denomination-input.component';
import { CuadreDetailModalComponent } from './components/cuadre-detail-modal/cuadre-detail-modal.component';
import { CuadreMovementsEditorComponent } from './components/cuadre-movements-editor/cuadre-movements-editor.component';
import { CuadreSummaryComponent } from './components/cuadre-summary/cuadre-summary.component';
import { ConfigCuadresComponent } from './components/config-cuadres/config-cuadres.component';
import { CuadresComponent } from './cuadres.component';
import { CuadresRoutingModule } from './cuadres.routing';
import { BtnIconModule } from '@components/btn-icon-circular/btn-icon-circular.module';

@NgModule({
  declarations: [CuadresComponent, CuadreDenominationInputComponent, CuadreDetailModalComponent, CuadreMovementsEditorComponent, CuadreSummaryComponent, ConfigCuadresComponent],
  imports: [CommonModule, CuadresRoutingModule, FormsModule, ReactiveFormsModule, TablasModule, DirectivesModule, PrimengModule, FormDivisaInputModule, NgxPermissionsModule.forChild(), BtnIconModule],
})
export class CuadresModule {}
