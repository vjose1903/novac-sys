import { CrudG } from '../../../core/typescript/crud-g';

export class RolesC extends CrudG<any> {
  constructor() {
    super('roles');
  }
}
export class PermisosC extends CrudG<any> {
  constructor() {
    super('permisos');
  }
}


export class AccionesC extends CrudG<any> {
  constructor() {
    super('acciones');
  }
}
