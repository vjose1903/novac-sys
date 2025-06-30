import { Injectable } from '@angular/core';
import { EmpresaI } from '@core/interface/config-interface';
import { FirebaseRequest } from '@core/typescript/firebaseRequest';
import { Environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService extends FirebaseRequest<EmpresaI> {
  private _collectionName = 'Empresas';

  constructor() {
    super();
    this.firebaseCollectionName = this._collectionName;
    // this.getEmpresa(Environment.empresa_key);
  }

  private _empresa: EmpresaI;
  

  set setEmpresa(empresa) {
    this._empresa = empresa;
  }

  get empresa() {
    return this._empresa;
  }

  get collectionName() {
    return this._collectionName;
  }


  getEmpresa(key: string) {
    this._getOne({ find_by: 'key', find_value: key }).then((empresa) => {
      this.setEmpresa = empresa;
    });
  }
}
