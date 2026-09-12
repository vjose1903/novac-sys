import { Ss } from '@core/services/singleton.service';
import { Environment } from '@environments/environment';

export type DevelopmentServerMode = 'local' | 'remote';

function developmentServerKey() {
  return `novac-dev-server:${Ss.configServ.config.machineId}`;
}

export function getDevelopmentServerMode(): DevelopmentServerMode {
  if (Environment.production) return 'remote';

  try {
    return localStorage.getItem(developmentServerKey()) === 'local' ? 'local' : 'remote';
  } catch {
    return 'remote';
  }
}

export function setDevelopmentServerMode(mode: DevelopmentServerMode): void {
  if (Environment.production) return;
  if (mode !== 'local' && mode !== 'remote') return;
  if (mode === 'local' && !Environment[Ss.configServ.config.machineId]) {
    throw new Error('No hay un servidor local configurado para este equipo.');
  }

  localStorage.setItem(developmentServerKey(), mode);
}

export function getUrlInUse() {
  const configApp = Ss.configServ.config;

  if (!Environment.production && getDevelopmentServerMode() === 'local') {
    return Environment[configApp.machineId];
  }

  return configApp.usa_url_principal ? configApp.url_servidor : configApp.url_servidor_respaldo;
}
