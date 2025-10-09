import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Ss } from '@core/services/singleton.service';
import { ConfigI } from '@core/interface/config-interface';
import { SharedService } from '@core/services/shared.service';
import { teclasCode } from '@core/typescript/constantes';
import { FacturacionService } from '@admin/facturacion/facturacion.service';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { tipoDocFacturacion } from '@admin/facturacion/factura';

@Component({
  selector: 'app-confirmacion-imprimir',
  templateUrl: './confirmacion-imprimir.component.html',
  styleUrls: ['./confirmacion-imprimir.component.scss'],
  standalone: false,
})
export class ConfirmacionImprimirComponent implements OnInit, IDynamicModal {
  @HostListener('window:keyup', ['$event'])
  handleKeyboardEvent(event: any) {
    event.stopPropagation();
    const key = event.keyCode;

    if (key == teclasCode._p || key == teclasCode._P) this.is_print = !this.is_print;

    if (key == teclasCode._enter) this.submit();
  }

  constructor(
    private shServ: SharedService,
    public factServ: FacturacionService
  ) {}

  @Input() modalConfig!: IModalConfiguration;
  @Input() modalWrapper!: DynamicModalComponent;

  @Input() metodo: tipoDocFacturacion;
  @Input() condicion_fact: string;
  @Input() modo_factura: string;
  @Input() is_viaje: boolean;

  configApp: ConfigI;
  documentos_a_imprimir = [];
  documento;

  is_print: boolean;

  get documentoParams() {
    return { metodo: this.metodo, condicion_fact: this.condicion_fact, modo_factura: this.modo_factura, is_viaje: this.is_viaje };
  }

  useEl = [tipoDocFacturacion.conduce];

  ngOnInit(): void {
    this.configApp = Ss.configServ.config;
    this.documentos_a_imprimir = this.shServ.formatDocumentosAImprimir(this.configApp.documentos_a_imprimir);
    this.documento = this.factServ.getDocumentoDescripcion(this.documentoParams);

    this.handleDefaultSwitch();
  }

  handleDefaultSwitch() {
    if (this.metodo == 'venta') {
      const comparation = this.condicion_fact == 'Crédito' ? 'venta_credito' : 'venta_contado';
      this.is_print = this.documentos_a_imprimir.includes(comparation);
    } else {
      this.is_print = this.documentos_a_imprimir.includes(this.metodo);
    }
  }

  submit() {
    this.modalConfig.close({ is_print: this.is_print });
  }
}
