import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NcfRoutingModule } from './ncf.routing';
import { NcfComponent } from './ncf.component';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { TablasModule } from '../../components/tablas/tablas.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [NcfComponent],
  imports: [CommonModule, NcfRoutingModule, FormsModule, ReactiveFormsModule, NgxBootstrapModule, TablasModule],
})
export class NcfModule {}
