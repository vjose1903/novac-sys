import { ConfigService } from './../../../core/services/configuration.service';
import { Component, HostListener, OnInit } from '@angular/core';
import { IModalConfiguration, ModalComponentI, ModalI } from '../../components/modal/modal-class';
import { SharedService } from '../../../core/services/shared.service';
import { teclasCode } from '../../../core/typescript/constantes';
import * as _ from 'lodash';
import { FacturacionService } from '../facturacion.service';

@Component({
  selector: 'app-confirmacion-imprimir',
  templateUrl: './confirmacion-imprimir.component.html',
  styleUrls: ['./confirmacion-imprimir.component.scss'],
})
export class ConfirmacionImprimirComponent implements OnInit, ModalI {
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;

    if (key == teclasCode._enter) this.btn_aceptar();
  }

  constructor(private shServ: SharedService, public factServ: FacturacionService) {}

  modalComponent: ModalComponentI= {};
  inputs: any;
  documentos_a_imprimir = [];
  documento;

  is_print: boolean;

  ngOnInit(): void {
    this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(ConfigService.config.documentos_a_imprimir);
    this.documento = this.factServ.getDocumentoDescripcion(this.inputs, true);

    this.handleDefaultSwitch();
  }

  handleDefaultSwitch() {
    if (this.inputs.metodo == 'venta') {
      const comparation = this.inputs.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.inputs.metodo);
    }
  }

  btn_aceptar() {
    this.modalComponent.closeModal(this.modalComponent.id, { is_print: this.is_print, modalId: this.modalComponent.id });
  }
}
