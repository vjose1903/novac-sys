import { fun } from '../../services/functions.service';
import { CrudG } from '../crud-g';

export interface ProvinciaI {
  id: number;
  nombre: string;
  codigo: string;
  municipios: MunicipioI[];
}

export interface MunicipioI {
  id: number;
  nombre: string;
  codigo: string;
}

export class ProvinciaC extends CrudG<ProvinciaI> {
  constructor() {
    super('provincias');
  }

  async getAllProvincias(): Promise<ProvinciaI[]> {
    const data = (await super.getAll()).data as ProvinciaI[];

    return data.map(prov => ({
      ...prov,
      nombre: fun.capitalice(prov.nombre),
      municipios: prov.municipios.map((muni)=> ({...muni, nombre: fun.capitalice(muni.nombre)}))
    }));
  }
}
