import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles.routing';
import { RolesComponent } from './roles.component';
import { AngularModule } from '../../../modules/angular.module';
import { PrimengModule } from '../../../modules/primeng.module';
import { PipesModule } from '../../../core/pipe/pipes.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { TablasModule } from '../../components/tablas/tablas.module';

@NgModule({
  declarations: [RolesComponent],
  imports: [CommonModule, RolesRoutingModule, AngularModule, PrimengModule, PipesModule, DirectivesModule, TablasModule],
})
export class RolesModule {}
