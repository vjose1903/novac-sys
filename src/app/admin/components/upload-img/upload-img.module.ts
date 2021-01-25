import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UploadImgRoutingModule } from './upload-img.routing';
import { UploadImgComponent } from './upload-img.component';

@NgModule({
  declarations: [UploadImgComponent],
  imports: [CommonModule, UploadImgRoutingModule],
  exports: [UploadImgComponent],
})
export class UploadImgModule {}
