import { Ss } from './../services/singleton.service';
import { ConfigI } from './config-interface.utils';
import { AppConfig } from '../../../environments/environment';

export function getUrlInUse() {
  const configApp: ConfigI = Ss.configServ.getConfig({ isPromise: false });

  const url = configApp.is_development ? AppConfig[configApp.gitUser] : configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;
  // const url = configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;

  return url;
}
