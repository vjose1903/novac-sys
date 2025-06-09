import { Component, OnInit } from '@angular/core';

import { ModalI } from '../modal/modal-class';
import { inputViewerOptions } from './pdf-viewer';
import { fun } from '@core/services/functions.service';
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

  fun = fun;

  get ncf_referenced() {
    return this.inputs?.factura?.document_reference?.document_referenced?.numero_comprobante;
  }

  btn_aceptar() {}

  ngOnInit(): void {
    this.inputs ??= { viewerOptions: {} };
    this.inputs.documento ??= 'Factura';
  }
}
