import { TreeNode } from 'primeng/api';

import { fun } from '../../../../../core/services/functions.service';
import { Injectable } from '@angular/core';
import { CuentaContableI } from '../cuentas-contables-form/cuentas_contables.utils';

@Injectable({
  providedIn: 'root',
})
export class CuentasContablesService {
  constructor() {}

  cuentasIterator(cuentasContables): Array<TreeNode> {
    const treeParsed: TreeNode[] = [];

    for (let index = 0; index < cuentasContables.length; index++) {
      const cuenta: CuentaContableI = cuentasContables[index];

      const treeItem: TreeNode = {};
      treeItem['data'] = cuenta;
      treeItem['expanded'] = true;

      if (fun.objHas(cuenta, 'cuentas_contables') && fun.hasValue(cuenta.cuentas_contables)) {
        treeItem['children'] = this.cuentasIterator(cuenta.cuentas_contables);
      }

      treeParsed.push(treeItem);
    }

    return treeParsed;
  }
}
