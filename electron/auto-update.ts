import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

import {
  ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE,
  ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE,
  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS,
  ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED,
  ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE,
  ELECTRON_EVENT_UPDATE_ERROR,
  KEYWORD_ELECTRON_RESPONSE,
} from './shared-electron-angular';

import Functions from './functions';
import { ConfigI } from '../src/app/core/typescript/config-interface';
import { puts } from '../main';

export default class AppUpdater {
  constructor(win) {
    puts(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');

    const log = require('electron-log');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    this.checkForUpdates(win);
  }

  async checkForUpdates(win) {
    autoUpdater.setFeedURL({ provider: 'github', owner: 'vjose1903', repo: 'novac-system-agrodemi', token: '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', private: true, autoDownload: false, autoUpdate: true });
    autoUpdater.checkForUpdatesAndNotify();

    puts('-=-=-=-=- handleUpdateEvents -=-=-=-=-');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, (info) => {
      puts(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info: { msg: 'Actualizacion no disponible...', body: info } });
      puts(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      puts(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE >>>>>>>>>>>>');

      // TODO: hacer que esto sea decidido por el usuario
      // Iniciar la descarga de la actualización
      autoUpdater.downloadUpdate();

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, info: info });

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

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, info: { msg: 'descarga finalizada...', body: returnValue } });
        if (returnValue.response == 0) autoUpdater.quitAndInstall();
      });

      puts(' FINAL - ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      puts(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, 'ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...', url: autoUpdater.getFeedURL() } });
      puts(' FINAL - ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, (progress) => {
      puts(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, ' ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, info: { msg: 'descarga porciento...', body: progress } });
      puts('FINAL -  ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS >>>>>>>>>>>>');
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, (error) => {
      puts(ELECTRON_EVENT_UPDATE_ERROR, 'ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_ERROR, info: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
      puts('FINAL - ELECTRON_EVENT_UPDATE_ERROR >>>>>>>>>>>>');
    });
  }

  sendEventToAngular(win, params: { event_name: string; info: any }) {
    if (win) win.webContents.send(KEYWORD_ELECTRON_RESPONSE, { event_name: params.event_name, info: params.info });
  }
}
