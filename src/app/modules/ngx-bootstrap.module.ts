import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AlertModule } from 'ngx-bootstrap/alert';
import { BsDatepickerModule, DatepickerModule } from 'ngx-bootstrap/datepicker';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { ToastrModule } from 'ngx-toastr';
import { NgxPaginationModule } from 'ngx-pagination';
import { AccordionModule } from 'ngx-bootstrap/accordion';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CarouselModule.forRoot(),
    ModalModule.forRoot(),
    ButtonsModule.forRoot(),
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    BsDatepickerModule.forRoot(),
    DatepickerModule,
    TabsModule.forRoot(),
    ToastrModule.forRoot(),
    NgxPaginationModule,
    AccordionModule.forRoot(),
  ],
  exports: [CarouselModule, ModalModule, ButtonsModule, BsDropdownModule, AlertModule, BsDatepickerModule, DatepickerModule, TabsModule, ToastrModule, AccordionModule, NgxPaginationModule],
})
export class NgxBootstrapModule {}
