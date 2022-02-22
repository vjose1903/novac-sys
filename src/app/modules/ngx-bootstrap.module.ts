import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsDatepickerModule, DatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [],
  imports: [CommonModule, BsDropdownModule.forRoot(), BsDatepickerModule.forRoot(), DatepickerModule, NgxPaginationModule],
  exports: [BsDropdownModule, BsDatepickerModule, DatepickerModule, NgxPaginationModule],
})
export class NgxBootstrapModule {}
