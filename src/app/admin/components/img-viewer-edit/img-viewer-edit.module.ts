import { PrimengModule } from './../../../modules/primeng.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImgViewerEdit } from './img-viewer-edit.component';

@NgModule({
  declarations: [ImgViewerEdit],
  imports: [CommonModule, PrimengModule],
  exports: [ImgViewerEdit],
})
export class ImgViewerEditModule {}
