import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsgErrorDirective } from './msg-error.directive';
import { PaswordConfirmDirective } from './pasword-confirm-directive.directive';
import { OnScrollDirective } from './on-scroll.directive';

const directives = [MsgErrorDirective, PaswordConfirmDirective, OnScrollDirective];

@NgModule({
  declarations: directives,
  imports: [CommonModule],
  exports: directives,
})
export class DirectivesModule {}
