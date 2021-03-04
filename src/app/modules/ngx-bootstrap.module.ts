import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsDatepickerModule, DatepickerModule } from 'ngx-bootstrap/datepicker';
import { CarouselModule } from 'ngx-bootstrap/carousel';

import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [],
  imports: [CommonModule, CarouselModule.forRoot(), BsDropdownModule.forRoot(), BsDatepickerModule.forRoot(), DatepickerModule, NgxPaginationModule],
  exports: [CarouselModule, BsDropdownModule, BsDatepickerModule, DatepickerModule, NgxPaginationModule],
})
export class NgxBootstrapModule {}
