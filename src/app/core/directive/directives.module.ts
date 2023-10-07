import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsgErrorDirective } from './msg-error.directive';
import { PaswordConfirmDirective } from './pasword-confirm-directive.directive';
import { OnScrollDirective } from './on-scroll.directive';
import { DataFilterDirective } from './data-filter.directive';
import { SizeCatcherDirective } from './size-catcher.directive';

const directives = [MsgErrorDirective, PaswordConfirmDirective, OnScrollDirective, DataFilterDirective, SizeCatcherDirective];

@NgModule({
  declarations: directives,
  imports: [CommonModule],
  exports: directives,
})
export class DirectivesModule {}
