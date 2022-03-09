import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles.routing';
import { RolesComponent } from './roles.component';
import { PrimengModule } from '../../../modules/primeng.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [RolesComponent],
  imports: [CommonModule,
    RolesRoutingModule,
    TablasModule,
    ReactiveFormsModule,
    FormsModule,
    DirectivesModule,
    PrimengModule],
})
export class RolesModule {}
