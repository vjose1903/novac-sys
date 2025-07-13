import { Injectable } from '@angular/core';
import { EmpresaI } from '@core/interface/config-interface';
import { FirebaseRequest } from '@core/typescript/firebase/firebaseRequest';
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

  set empresa(empresa) {
    this._empresa = empresa;
  }

  get empresa() {
    return this._empresa;
  }

  get collectionName() {
    return this._collectionName;
  }

  setEmpresa() {
    this.getEmpresa(Environment.empresa_key);
  }

  getEmpresa(key: string) {
    this._getOne({ find_by: 'key', find_value: key }).then(empresa => {
      this.empresa = empresa;
    });
  }
}
