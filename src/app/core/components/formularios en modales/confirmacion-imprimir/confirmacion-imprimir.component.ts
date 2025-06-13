import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Ss } from '@core/services/singleton.service';
import { ConfigI } from '@core/interface/config-interface';
import { ModalI } from '../../modal/modal-class';
import { SharedService } from '@core/services/shared.service';
import { teclasCode } from '@core/typescript/constantes';
import * as _ from 'lodash';
import { FacturacionService } from '@admin/facturacion/facturacion.service';

@Component({
  selector: 'app-confirmacion-imprimir',
  templateUrl: './confirmacion-imprimir.component.html',
  styleUrls: ['./confirmacion-imprimir.component.scss'],
  standalone: false,
})
export class ConfirmacionImprimirComponent implements OnInit, ModalI {
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;

    if (key == teclasCode._enter) this.btn_aceptar();
  }

  constructor(
    private shServ: SharedService,
    public factServ: FacturacionService
  ) {}

  @Input() modalWrapper: any = {};
  inputs: any;
  configApp: ConfigI;
  documentos_a_imprimir = [];
  documento;

  is_print: boolean;

  ngOnInit(): void {
    this.configApp = Ss.configServ.config;
    this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
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
    const modal = _.find(this.modalWrapper.instance.modalsConfig, config => config.id === this.modalWrapper.component_id);
    modal.closeModal(this.modalWrapper.component_id);
    modal.returnDataFromModal({ is_print: this.is_print, modal_id: this.modalWrapper.component_id });
  }
}
