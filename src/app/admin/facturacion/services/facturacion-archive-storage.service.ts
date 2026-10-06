import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';
import * as _ from 'lodash';
import { FactsLocalStorage } from '../factsLocalStorage';

@Injectable({
  providedIn: 'root',
})
export class FacturacionArchiveStorageService {
  getCurrentArchivedCopy(archivoId: any) {
    const facturaGuardada = FactsLocalStorage.getList().find(item => item.archivo_id == archivoId);
    return facturaGuardada ? _.omit(facturaGuardada, ['archivo_id', 'cliente', 'suplidor']) : undefined;
  }

  exists(archivoId: any): boolean {
    return FactsLocalStorage.getList().some((fact: any) => fact.archivo_id == archivoId);
  }

  save(params: { factura: any; facturaGuardada: any; propietario: any; propietarioKey: 'cliente' | 'suplidor' | null }): void {
    const facturasLocalStorage = (FactsLocalStorage.getList() || []).sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));
    const facturaAGuardar = fun.deepCloning(params.factura);
    const indexFactura = facturasLocalStorage.findIndex((facts: any) => facts?.archivo_id == params.facturaGuardada?.archivo_id);

    if (!fun.isEmpty(params.propietario?.id) && params.propietarioKey) {
      facturaAGuardar[params.propietarioKey] = params.propietario;
    }

    if (fun.hasValue(indexFactura) && indexFactura >= 0) {
      facturaAGuardar['archivo_id'] = params.facturaGuardada?.archivo_id;
      facturasLocalStorage[indexFactura] = facturaAGuardar;
    } else {
      facturaAGuardar['archivo_id'] = facturasLocalStorage.length > 0 ? _.last(facturasLocalStorage).archivo_id + 1 : 1;
      facturasLocalStorage.push(facturaAGuardar);
    }

    facturasLocalStorage.sort((a, b) => fun.compare(a, b, ['archivo_id'], 'asc'));
    FactsLocalStorage.setList(facturasLocalStorage);
  }
}
