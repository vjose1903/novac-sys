import { DocumentoDeIdentidadI } from './../../../core/typescript/documentos_de_identidad.utils';
import { EntidadCuentaContableI } from './../../contabilidad/entidad-cuenta-contable/cuenta-contable-form/cuenta-contable-form.utils';
import { CrudG } from '../../../core/typescript/crud-g';

export class EmpleadoC extends CrudG<any> {
  constructor() {
    super('users');
  }
}

export interface EmpleadoI {
  id: number;
  nombre: string;
  usuario: string;
  estado: boolean;
  apellido: string;
  sexo: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string;
  role?: null;
  sign_in_count?: number;
  nombre_completo?: string;
  documentos_de_identidad: DocumentoDeIdentidadI[];
  cuentas_contables?: EntidadCuentaContableI[];
  imagenes?: any[];
  roles?: Role[];
  documento_identidad?: string;
  [nombreProp: string]: any;
}

export interface Role {
  id: number;
  descripcion: string;
  nombre: string;
}
