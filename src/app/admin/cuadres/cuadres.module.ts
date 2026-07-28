import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TablasModule } from '@components/new_tablas/tablas.module';
import { DirectivesModule } from '@core/directive/directives.module';
import { PrimengModule } from '../../modules/primeng.module';
import { CuadreDenominationInputComponent } from './components/cuadre-denomination-input/cuadre-denomination-input.component';
import { CuadreMovementsEditorComponent } from './components/cuadre-movements-editor/cuadre-movements-editor.component';
import { CuadreSummaryComponent } from './components/cuadre-summary/cuadre-summary.component';
import { CuadresComponent } from './cuadres.component';
import { CuadresRoutingModule } from './cuadres.routing';

@NgModule({
  declarations: [CuadresComponent, CuadreDenominationInputComponent, CuadreMovementsEditorComponent, CuadreSummaryComponent],
  imports: [CommonModule, CuadresRoutingModule, FormsModule, ReactiveFormsModule, TablasModule, DirectivesModule, PrimengModule, NgxPermissionsModule.forChild()],
})
export class CuadresModule {}
