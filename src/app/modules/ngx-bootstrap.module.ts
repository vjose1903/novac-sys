import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgxPaginationModule } from 'ngx-pagination';

@NgModule({
  declarations: [],
  imports: [CommonModule, BsDropdownModule.forRoot(), NgxPaginationModule],
  exports: [BsDropdownModule, NgxPaginationModule],
})
export class NgxBootstrapModule {}
