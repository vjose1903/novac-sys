import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigI, EmpresaI } from '@core/interface/config-interface';
import { FirebaseRequest } from '@core/typescript/firebaseRequest';
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

  private _config: ConfigI;
  private configLoadedSubject = new BehaviorSubject<boolean>(false);

  // Observable público para suscribirse al estado de carga
  public configLoaded$: Observable<boolean> = this.configLoadedSubject.asObservable();

  set setConfig(configuration) {
    this._config = configuration;
    // Notificar que la configuración ya está cargada
    this.configLoadedSubject.next(true);
  }

  get config() {
    return this._config;
  }

  // Método para verificar si la configuración está cargada
  isConfigLoaded(): boolean {
    return this.configLoadedSubject.value;
  }

  saveConfig(key: string) {
    if (fun.isEmpty(this.empresaServ.empresa)) throw new Error('Empresa is not defined');

    this._createOne({  data: { key: key } });
  }
}
