import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigI } from '@core/interface/config-interface';
import { FirebaseRequest } from '@core/typescript/firebase/firebaseRequest';
import { EmpresaService } from './empresa.service';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService extends FirebaseRequest<ConfigI> {
  empresaServ = inject(EmpresaService);

  constructor() {
    super();
    this.firebaseCollectionName = 'configuration';
  }

  // Observable público para suscribirse al estado de carga
  private _config: BehaviorSubject<ConfigI> = new BehaviorSubject<ConfigI | null>(null);

  // Observables públicos
  get config$(): Observable<ConfigI> {
    return this._config.asObservable();
  }

  get config(): ConfigI {
    return this._config.value;
  }

  set config(value: ConfigI) {
    this._config.next(value);
  }

  // Método para verificar si la configuración está cargada
  isConfigLoaded(): boolean {
    return this._config.value !== null;
  }

  async createConfig(newConfig: ConfigI): Promise<ConfigI> {
    if (fun.isEmpty(this.empresaServ.empresa)) throw new Error('Empresa is not defined');

    return await this.createOneInParentCollection({ parentCollection: this.empresaServ.collectionName, parentId: this.empresaServ.empresa.id, data: newConfig });
  }

  async updateConfig(newConfig: ConfigI): Promise<ConfigI> {
    if (fun.isEmpty(this.empresaServ.empresa)) throw new Error('Empresa is not defined');
    if (fun.isEmpty(newConfig.id)) throw new Error('Config id is not defined');

    return await this.updateOneInParentCollection({ parentCollection: this.empresaServ.collectionName, parentId: this.empresaServ.empresa.id, documentId: newConfig.id, data: newConfig });
  }
}
