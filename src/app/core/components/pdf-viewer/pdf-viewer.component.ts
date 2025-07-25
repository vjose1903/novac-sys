import { Component, Input } from '@angular/core';

import { viewerOptions } from './pdf-viewer';
import { fun } from '@core/services/functions.service';
import { IDynamicModal, IModalConfiguration } from '../dynamic-modal/config/dynamic-modal.interface';
import { DynamicModalComponent } from '../dynamic-modal/dynamic-modal.component';
import { FacturasI } from '@admin/facturacion/factura';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  standalone: false,
})
export class PdfViewerComponent implements IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig: IModalConfiguration;

  @Input() viewerOptions: viewerOptions = {};
  @Input() show_estado: boolean;
  @Input() estado_documento: string;
  @Input() base64: string;
  @Input() documento: string = 'Factura';
  @Input() reimprimir: boolean;
  @Input() fileName: string;
  @Input() factura: FacturasI = null;

  fun = fun;

  get ncf_referenced() {
    return this.factura?.document_reference?.document_referenced?.numero_comprobante;
  }

  constructor() {}

  btn_aceptar() {}
}
