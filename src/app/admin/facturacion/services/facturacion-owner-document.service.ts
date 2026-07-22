import { Injectable } from '@angular/core';
import { fun } from '@core/services/functions.service';

export type PropietarioDocumentoTipo = 'cedula' | 'rnc' | null;

export interface PropietarioDocumentoInfo {
  documento: string | null;
  tipo: PropietarioDocumentoTipo;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionOwnerDocumentService {
  normalizeDocumentoIdentidad(documento: string | null): string | null {
    if (fun.isEmpty(documento)) return null;

    return String(documento).replace(/\D/g, '');
  }

  getDocumentoInfo(propietario: any): PropietarioDocumentoInfo {
    const docs = propietario?.documentos_de_identidad ?? [];
    const docPrincipal = docs.find(doc => doc?.principal && ['cedula', 'rnc'].includes(String(doc?.descripcion ?? '').toLowerCase()));
    const documentoDirecto = propietario?.documento_identidad ?? propietario?.documento ?? propietario?.NoCliente_rnc ?? propietario?.cedula ?? propietario?.rnc ?? null;

    if (fun.hasValue(docPrincipal?.documento)) {
      return {
        documento: docPrincipal.documento,
        tipo: String(docPrincipal.descripcion).toLowerCase() === 'rnc' ? 'rnc' : 'cedula',
      };
    }

    if (fun.hasValue(documentoDirecto)) {
      const documentoNormalizado = this.normalizeDocumentoIdentidad(documentoDirecto);
      const tipo = documentoNormalizado.length === 9 ? 'rnc' : documentoNormalizado.length === 11 ? 'cedula' : null;

      return { documento: documentoDirecto, tipo };
    }

    return { documento: null, tipo: null };
  }
}
