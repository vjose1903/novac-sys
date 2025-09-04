import { Ss } from '@core/services/singleton.service';
import { Environment } from '@environments/environment';

export function getUrlInUse() {
  const configApp = Ss.configServ.config;

  const url = !Environment.production ? Environment[configApp.machineId] : configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;

  // const url = configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;
  return url;
}
