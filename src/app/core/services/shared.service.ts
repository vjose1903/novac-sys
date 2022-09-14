import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  canToast: boolean = false;

  constructor() {}

  nextCanToast(nextValue) {
    this.canToast = nextValue;
  }

  formatDocumentosAImprimir(listado) {
    const documentos_a_imprimir_temp = listado.split(',');
    return documentos_a_imprimir_temp;
  }
}
