import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsgErrorDirective } from './msg-error.directive';
import { PaswordConfirmDirective } from './pasword-confirm-directive.directive';
import { OnScrollDirective } from './on-scroll.directive';
import { DataFilterDirective } from './data-filter.directive';
import { SizeCatcherDirective } from './size-catcher.directive';
import { MultiClickDirective } from './multi-click.directive';
import { OnElementReadyDirective } from './on-element-ready.directive';
import { ElementResizedDirective } from './element-resized.directive';
import { RequiredFieldDirective } from './required-field.directive';
import { CapitaliceDirective } from './capitalice.directive';

const directives = [MsgErrorDirective, PaswordConfirmDirective, OnScrollDirective, DataFilterDirective, SizeCatcherDirective, MultiClickDirective, OnElementReadyDirective, ElementResizedDirective, RequiredFieldDirective, CapitaliceDirective];

@NgModule({
  declarations: directives,
  imports: [CommonModule],
  
  exports: directives,
})
export class DirectivesModule {}
