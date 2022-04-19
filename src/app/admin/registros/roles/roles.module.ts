import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularResizedEventModule } from 'angular-resize-event';
import { RolesRoutingModule } from './roles.routing';
import { RolesComponent } from './roles.component';
import { PrimengModule } from '../../../modules/primeng.module';
import { DirectivesModule } from '../../../core/directive/directives.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [RolesComponent],
  imports: [CommonModule, RolesRoutingModule, TablasModule, NewTablasModule, AngularResizedEventModule, ReactiveFormsModule, FormsModule, DirectivesModule, PrimengModule],
})
export class RolesModule {}
