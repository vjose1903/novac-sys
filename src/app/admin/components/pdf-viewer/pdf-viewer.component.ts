import { Component, OnInit } from '@angular/core';
import { ModalI } from '../modal/modal-class';
@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
})
export class PdfViewerComponent implements OnInit, ModalI {
  constructor() {}
  modal: any = {};
  inputs: any;
  btn_aceptar() {}

  ngOnInit(): void {}
}
