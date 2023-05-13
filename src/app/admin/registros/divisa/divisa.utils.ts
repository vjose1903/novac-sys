import { ImagenI } from '../../../core/typescript/imagen.utils';

import { CrudG } from '../../../core/typescript/crud-g';

export class DivisaC extends CrudG<any> {
  constructor() {
    super('divisas');
  }
}

export interface DivisaI {
  id: number;
  nombre: string;
  simbolo: string;
  is_principal: boolean;
  estado: boolean;
  imagenes: ImagenI[];
  [nombrePropiedad: string]: any;
}
