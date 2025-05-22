import { Component, OnInit } from '@angular/core';

import { ModalI } from '../modal/modal-class';
import { inputViewerOptions } from './pdf-viewer';
@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  standalone: false,
})
export class PdfViewerComponent implements OnInit, ModalI {
  constructor() {}
  modal: any = {};
  inputs: inputViewerOptions;
  btn_aceptar() {}

  ngOnInit(): void {
    this.inputs ??= { viewerOptions: {} };
    this.inputs.documento ??= 'Factura';
  }
}
