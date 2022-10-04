import { PdfService } from './../../../../core/services/pdf/pdf.service';
import { fun } from '../../../../core/services/functions.service';
import { Injectable } from '@angular/core';
import { facturaPrueba } from './8.5x5.5/factura';
import * as _ from 'lodash';

const documentos = {
  '8.5x5.5': {
    factura: { data: facturaPrueba, type: 'facturacion' },
  },
};

export function printTestPdf(params: { paper_size: string; documento: string }): any {
  PdfService.generatePdf({ oPdf: documentos[params.paper_size][params.documento], imprimir: true }).then(async (res) => {});
}
