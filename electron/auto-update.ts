import { autoUpdater, type UpdateDownloadedEvent, type AppUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';

import SharedElectronAngular, {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_ERROR,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
} from './shared-electron-angular';

import { writeLogs } from '../main';
import { BrowserWindow } from 'electron';
import { sharedState } from './shared-state';

export default class AppUpdate {
  win: BrowserWindow;
  serve_: boolean;
  autoUpdater: AppUpdater;
  constructor(win, serve_) {
    this.win = win;
    this.serve_ = serve_;
    this.autoUpdater = autoUpdater;
  }

  init() {
    if (!this.serve_) {
      writeLogs(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');

      const log = require('electron-log');
      log.transports.file.level = 'info';
      this.autoUpdater.logger = log;

      this.checkForUpdates(this.win);
    }
  }

  async checkForUpdates(win) {
    this.autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: 'novac-system-agrodemi', token: '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', private: true });
    this.autoUpdater.checkForUpdatesAndNotify();

    writeLogs('-=-=-=-=- handleUpdateEvents -=-=-=-=-');
    SharedElectronAngular.sendEventToAngular(win, { eventName: 'init', data: { msg: '-=-=-=-=- handleUpdateEvents -=-=-=-=-' } });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info => {
      writeLogs(info, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, data: { msg: 'Actualizacion no disponible...', body: info } });
      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      writeLogs(info, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

      // Ahora solo enviamos la información al front y dejamos que el usuario decida
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, data: info });

      writeLogs('FINAL - ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event: UpdateDownloadedEvent) => {
      writeLogs(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, 'ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');
      writeLogs(event, 'ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');

      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, data: { msg: 'descarga finalizada...' } });

      // Configurar la variable global para indicar que estamos cerrando para actualizar
      sharedState.isUpdaterClosing = true;

      this.autoUpdater.quitAndInstall();

      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      writeLogs(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, 'ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, data: { msg: 'verificando actualizacion...', url: this.autoUpdater.getFeedURL() } });
      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, progress => {
      writeLogs(progress, ' ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, data: { msg: 'descarga porciento...', body: progress } });
      writeLogs('FINAL -  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, error => {
      writeLogs(error, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_ERROR, data: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
      writeLogs('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    });
  }

  async downloadUpdate() {
    writeLogs('Iniciando descarga de actualización por solicitud del usuario');
    this.autoUpdater.downloadUpdate();
  }

  async verificateUpdateAvailable() {
    return new Promise<UpdateInfo | null>((resolve, reject) => {
      try {
        writeLogs('Simulando verificación de actualizaciones (MODO PRUEBA)');

        writeLogs('Iniciando verificación de actualizaciones');
        this.autoUpdater.checkForUpdates().then(res => {
          writeLogs(res, 'RESPUESTA DE VERIFICACION DE ACTUALIZACIONES');

          setTimeout(() => {
            if (res) {
              writeLogs('Actualización disponible');
              resolve(res.updateInfo);
            } else {
              writeLogs('No hay actualizaciones disponibles');
              resolve(null);
            }
          }, 1000);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
