import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NcfRoutingModule } from './ncf.routing';
import { NcfComponent } from './ncf.component';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { NewTablasModule } from '../../components/new_tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';

@NgModule({
  declarations: [NcfComponent],
  imports: [CommonModule, NcfRoutingModule, FormsModule, ReactiveFormsModule, NgxBootstrapModule, NewTablasModule, NgxPermissionsModule.forChild()],
})
export class NcfModule {}
