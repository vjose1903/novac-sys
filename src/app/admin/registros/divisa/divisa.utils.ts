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
  code: string;
  is_principal: boolean;
  estado: boolean;
  imagen: ImagenI;
  imagenes: ImagenI[];
  img_divisa?: string;
  current_tasa: number;
  [nombrePropiedad: string]: any;
}
