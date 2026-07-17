import { PdfService } from '@core/services/reports/pdf/pdf.service';
import { Injectable } from '@angular/core';
import { facturaPrueba } from './8.5x5.5/factura';
import * as _ from 'lodash';

const documentos = {
  '8.5x5.5': {
    venta_contado: { data: facturaPrueba, type: 'facturacion' },
  },
  '8.5x11': {
    venta_credito: { data: facturaPrueba, type: 'facturacion' },
  },
};

export function printTestPdf(params: { paper_size: string; documento: string }): any {
  PdfService.generatePdf({ oPdf: documentos[params.paper_size][params.documento], imprimir: true }).catch(() => {});
}
