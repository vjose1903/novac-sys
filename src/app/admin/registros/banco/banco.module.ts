import { PipesModule } from './../../../core/pipe/pipes.module';
import { TablasModule } from './../../components/new_tablas/tablas.module';
import { DirectivesModule } from './../../../core/directive/directives.module';
import { ImgViewerEditModule } from './../../components/img-viewer-edit/img-viewer-edit.module';
import { ImgModule } from './../../components/img-component/img.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BancoComponent } from './banco.component';
import { BancoRoutingModule } from './banco.routing';
import { NgxPermissionsModule } from 'ngx-permissions';
import { PrimengModule } from '../../../modules/primeng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BtnIconModule } from '../../components/btn-icon-circular/btn-icon-circular.module';
import { CuentaBancariaFormComponent } from './cuenta-bancaria-form/cuenta-bancaria-form.component';
import { TipoCuentaBancariaComponent } from './tipo-cuenta-bancaria/tipo-cuenta-bancaria.component';

@NgModule({
  declarations: [BancoComponent, CuentaBancariaFormComponent, TipoCuentaBancariaComponent],
  imports: [CommonModule, BancoRoutingModule, FormsModule, ReactiveFormsModule, PrimengModule, PipesModule, TablasModule, DirectivesModule, NgxPermissionsModule.forChild(), BtnIconModule, ImgViewerEditModule, ImgModule],
})
export class BancoModule {}
