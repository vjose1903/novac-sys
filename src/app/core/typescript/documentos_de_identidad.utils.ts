import { CrudG } from './crud-g';

export class DocumentosC extends CrudG<any> {
  constructor() {
    super('documentos_de_identidad');
  }
}

export enum documentoIdentidad {
  cedula = 'cedula',
  rnc = 'rnc',
  pasaporte = 'pasaporte',
}
export interface DocumentoDeIdentidadI {
  descripcion: 'cedula' | 'rnc';
  documento: string;
  principal: boolean;
  id: number;
}
