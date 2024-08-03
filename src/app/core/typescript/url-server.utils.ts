import { ConfigService } from './../services/configuration.service';
import { AppConfig } from '../../../environments/environment';

export function getUrlInUse() {
  const configApp = ConfigService.config;
  let url;

  if (configApp && configApp.gitUser) url = configApp.is_development ? AppConfig[configApp.gitUser] : configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;

  // const url = configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;

  return url;
}
