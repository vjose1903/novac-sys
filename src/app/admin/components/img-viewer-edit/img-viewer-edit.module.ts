import { PrimengModule } from './../../../modules/primeng.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImgViewerEdit } from './img-viewer-edit.component';
import { ImgModule } from '../img-component/img.module';

@NgModule({
  declarations: [ImgViewerEdit],
  imports: [CommonModule, PrimengModule, ImgModule],
  exports: [ImgViewerEdit],
})
export class ImgViewerEditModule {}
