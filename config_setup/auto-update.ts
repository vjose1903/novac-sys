const { autoUpdater } = require('electron-updater');

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

export default class AppUpdater {
  win: BrowserWindow;
  serve_: boolean;
  constructor(win, serve_) {
    this.win = win;
    this.serve_ = serve_;
  }

  init() {
    if (!this.serve_) {
      writeLogs(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');

      const log = require('electron-log');
      log.transports.file.level = 'info';
      autoUpdater.logger = log;

      // this.checkUpdates(win);
      this.checkForUpdates(this.win);
    }
  }

  async checkUpdates(win) {
    try {
      writeLogs(' . ');
      writeLogs('-=-=-=-=- checkUpdates -=-=-=-=-');
      writeLogs(' . ');

      autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: '$$NAME_UPDATE_REPO$$', token: '$$CUSTOM_ACCESS$$', private: true, autoDownload: false, autoUpdate: true });
      writeLogs(autoUpdater, 'autoUpdater >>>>>>>>>>>>');
      const updateInfo = await autoUpdater.checkForUpdatesPromise();

      if (updateInfo.updateAvailable) {
        writeLogs(updateInfo, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

        autoUpdater.downloadUpdate();
        SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, data: updateInfo });

        writeLogs('FINAL - ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');
      } else {
        writeLogs(updateInfo, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');

        SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, data: { msg: 'Actualizacion no disponible...', body: updateInfo } });

        writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      }
    } catch (error) {
      writeLogs(error, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');

      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_ERROR, data: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });

      writeLogs('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    }
  }

  async checkForUpdates(win) {
    autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: '$$NAME_UPDATE_REPO$$', token: '$$CUSTOM_ACCESS$$', private: true, autoDownload: false, autoUpdate: true });
    autoUpdater.checkForUpdatesAndNotify();

    writeLogs('-=-=-=-=- handleUpdateEvents -=-=-=-=-');
    SharedElectronAngular.sendEventToAngular(win, { eventName: 'init', data: { msg: '-=-=-=-=- handleUpdateEvents -=-=-=-=-' } });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info => {
      writeLogs(info, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, data: { msg: 'Actualizacion no disponible...', body: info } });
      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      writeLogs(info, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

      // TODO: hacer que esto sea decidido por el usuario
      // Iniciar la descarga de la actualización
      autoUpdater.downloadUpdate();

      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, data: info });

      const dialogOpts = {
        type: 'info',
        buttons: ['ok'],
        title: 'Actualización disponible',
        message: 'Novac System presenta una nueva actualizacion se empezará a descargar ahora.',
        detail: `Version a descargar: ${info.version}`,
      };

      writeLogs('FINAL - ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event, releaseNotes, releaseName) => {
      writeLogs(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, 'ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');

      const dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar'],
        title: 'Actualizacion descargada',
        message: process.platform == 'win32' ? releaseNotes : releaseName,
        detail: 'Para que las actualizaciones sean efectivas debe de reiniciar la aplicacion.',
      };

      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, data: { msg: 'descarga finalizada...' } });
      autoUpdater.quitAndInstall();

      // dialog.showMessageBox(dialogOpts).then((returnValue) => {
      //   SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, data: { msg: 'descarga finalizada...', body: returnValue } });
      //   if (returnValue.response == 0) autoUpdater.quitAndInstall();
      // });

      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      writeLogs(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, 'ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, data: { msg: 'verificando actualizacion...', url: autoUpdater.getFeedURL() } });
      writeLogs(' FINAL - ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, progress => {
      writeLogs(progress, ' ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, data: { msg: 'descarga porciento...', body: progress } });
      writeLogs('FINAL -  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, error => {
      writeLogs(error, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { eventName: ELECTRON_EVENT_UPDATE_ERROR, data: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
      writeLogs('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    });
  }
}
