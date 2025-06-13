import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigI } from '../interface/config-interface';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {

  constructor() {}

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
}
