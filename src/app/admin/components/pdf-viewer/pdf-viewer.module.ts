import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from './pdf-viewer.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
@NgModule({
  declarations: [PdfViewerComponent],
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  exports: [NgxExtendedPdfViewerModule],
})
export class PdfViewerModule {}
