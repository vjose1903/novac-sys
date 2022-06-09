import { Component, HostListener, OnInit } from '@angular/core';
import { SingletonService } from '../../../core/services/singleton.service';
import { ConfigI } from '../../../core/typescript/config-interface';
import { ModalI } from '../../components/modal/modal-class';
import { SharedService } from '../../../core/services/shared.service';
import { teclasCode } from '../../../core/typescript/constantes';
import * as _ from 'lodash';

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

  constructor(private shServ: SharedService) {}
  modal: any = {};
  inputs: any;
  configApp: ConfigI;
  documentos_a_imprimir = [];

  is_print: boolean;

  ngOnInit(): void {
    this.configApp = SingletonService.configServ.getConfig({ isPromise: false }) as ConfigI;
    this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);

    this.handleDefaultSwitch();
  }

  handleDefaultSwitch() {
    if (this.inputs.metodo == 'venta') {
      const comparation = this.inputs.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes('compra');
    }
  }

  btn_aceptar() {
    const modal = _.find(this.modal.instance.modalsConfig, (config) => config.id === this.modal.component_id);
    modal.closeModal(this.modal.component_id);

    modal.getDataModal({ data: { is_print: this.is_print }, modal_id: this.modal.component_id });
  }
}
