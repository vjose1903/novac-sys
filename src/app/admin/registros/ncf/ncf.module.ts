import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NcfRoutingModule } from './ncf.routing';
import { NcfComponent } from './ncf.component';
import { AngularModule } from '../../../modules/angular.module';
import { NgxBootstrapModule } from '../../../modules/ngx-bootstrap.module';
import { TablasModule } from '../../components/tablas/tablas.module';

@NgModule({
  declarations: [NcfComponent],
  imports: [CommonModule, NcfRoutingModule, AngularModule, NgxBootstrapModule, TablasModule],
})
export class NcfModule {}
