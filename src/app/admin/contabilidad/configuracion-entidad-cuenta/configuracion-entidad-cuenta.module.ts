import { NgxPermissionsModule } from 'ngx-permissions';
import { DirectivesModule } from './../../../core/directive/directives.module';
import { TablasModule } from './../../components/new_tablas/tablas.module';
import { BtnIconModule } from './../../components/btn-icon-circular/btn-icon-circular.module';
import { PrimengModule } from './../../../modules/primeng.module';
import { NgxBootstrapModule } from './../../../modules/ngx-bootstrap.module';
import { PipesModule } from './../../../core/pipe/pipes.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionEntidadCuentaComponent } from './configuracion-entidad-cuenta.component';
import { ConfiguracionEntidadCuentaRoutingModule } from './configuracion-entidad-cuenta.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ConfiguracionEntidadCuentaComponent],
  imports: [CommonModule, ConfiguracionEntidadCuentaRoutingModule, PipesModule, NgxBootstrapModule, PrimengModule, BtnIconModule, TablasModule, DirectivesModule, FormsModule, ReactiveFormsModule, NgxPermissionsModule.forChild()],
})
export class ConfiguracionEntidadCuentaModule {}
