import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NcfRoutingModule } from './ncf.routing';
import { NcfComponent } from './ncf.component';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { TablasModule } from '../../components/new_tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { PrimengModule } from './../../../modules/primeng.module';

@NgModule({
  declarations: [NcfComponent],
  imports: [CommonModule, NcfRoutingModule, FormsModule, ReactiveFormsModule, NgxBootstrapModule, TablasModule, NgxPermissionsModule.forChild(), PrimengModule],
})
export class NcfModule {}
