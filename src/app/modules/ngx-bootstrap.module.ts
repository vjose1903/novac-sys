import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [],
  imports: [CommonModule, BsDropdownModule.forRoot(), BsDatepickerModule.forRoot(), NgxPaginationModule],
  exports: [BsDropdownModule, BsDatepickerModule, NgxPaginationModule],
})
export class NgxBootstrapModule {}
