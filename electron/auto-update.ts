// import { autoUpdater } from 'electron-updater';
const { autoUpdater } = require('electron-updater');

import { BrowserWindow, dialog } from 'electron';

import SharedElectronAngular, {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
  ELECTRON_EVENT_UPDATE_ERROR,
  KEYWORD_ELECTRON_RESPONSE,
} from './shared-electron-angular';

import Functions from './functions';
import { ConfigI } from '../src/app/core/typescript/config-interface.utils';
import { puts } from '../main';

export default class AppUpdater {
  constructor(win) {
    puts(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');

    const log = require('electron-log');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // this.checkUpdates(win);
    this.checkForUpdates(win);
  }

  async checkUpdates(win) {
    try {
      puts(' . ');
      puts('-=-=-=-=- checkUpdates -=-=-=-=-');
      puts(' . ');

      autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: 'novac-system-agrodemi', token: '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', private: true, autoDownload: false, autoUpdate: true });
      puts(autoUpdater, 'autoUpdater >>>>>>>>>>>>');
      const updateInfo = await autoUpdater.checkForUpdatesPromise();

      if (updateInfo.updateAvailable) {
        puts(updateInfo, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

        autoUpdater.downloadUpdate();
        SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, info: updateInfo });

        puts('FINAL - ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');
      } else {
        puts(updateInfo, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');

        SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info: { msg: 'Actualizacion no disponible...', body: updateInfo } });

        puts(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      }
    } catch (error) {
      puts(error, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');

      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_ERROR, info: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });

      puts('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    }
  }

  async checkForUpdates(win) {
    autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: 'novac-system-agrodemi', token: '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', private: true, autoDownload: false, autoUpdate: true });
    autoUpdater.checkForUpdatesAndNotify();

    puts('-=-=-=-=- handleUpdateEvents -=-=-=-=-');
    SharedElectronAngular.sendEventToAngular(win, { event_name: 'init', info: { msg: '-=-=-=-=- handleUpdateEvents -=-=-=-=-' } });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, (info) => {
      puts(info, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info: { msg: 'Actualizacion no disponible...', body: info } });
      puts(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      puts(info, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

      // TODO: hacer que esto sea decidido por el usuario
      // Iniciar la descarga de la actualización
      autoUpdater.downloadUpdate();

      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, info: info });

      const dialogOpts = {
        type: 'info',
        buttons: ['ok'],
        title: 'Actualización disponible',
        message: 'Novac System presenta una nueva actualizacion se empezará a descargar ahora.',
        detail: `Version a descargar: ${info.version}`,
      };

      puts('FINAL - ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event, releaseNotes, releaseName) => {
      puts(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, 'ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');

      const dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar'],
        title: 'Actualizacion descargada',
        message: process.platform == 'win32' ? releaseNotes : releaseName,
        detail: 'Para que las actualizaciones sean efectivas debe de reiniciar la aplicacion.',
      };

      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, info: { msg: 'descarga finalizada...' } });
      autoUpdater.quitAndInstall();

      // dialog.showMessageBox(dialogOpts).then((returnValue) => {
      //   SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, info: { msg: 'descarga finalizada...', body: returnValue } });
      //   if (returnValue.response == 0) autoUpdater.quitAndInstall();
      // });

      puts(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      puts(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, 'ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...', url: autoUpdater.getFeedURL() } });
      puts(' FINAL - ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, (progress) => {
      puts(progress, ' ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, info: { msg: 'descarga porciento...', body: progress } });
      puts('FINAL -  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, (error) => {
      puts(error, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
      SharedElectronAngular.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_ERROR, info: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
      puts('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    });
  }
}
