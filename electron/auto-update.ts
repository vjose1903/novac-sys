import { autoUpdater, NsisUpdater } from 'electron-updater';
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
    const log = require('electron-log');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    puts('-=-=-=-=- DENTRO DE APP UPDATER -=-=-=-=-');
    setTimeout(() => this.checkForUpdates(win), 100);
  }

  async checkForUpdates(win) {
    puts('-=-=-=-=- checkForUpdates -=-=-=-=-');
    const autoUpdater = new NsisUpdater({ provider: 'github', owner: 'vjose1903', repo: 'novac-system', token: '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', private: true });

    puts('---- AQUIIIII CONSTRUCTOR ----');

    autoUpdater.checkForUpdatesAndNotify().then((value) => {
      this.sendEventToAngular(win, { event_name: 'test', info: { value: value, autoUpdater: autoUpdater } });
      puts(value, 'value CONSTRUCTOR');
    });
  }

  handleUpdateEvents(win: BrowserWindow) {
    puts('-=-=-=-=- handleUpdateEvents -=-=-=-=-');

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // setTimeout(() => this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...' } }), 10000);

    autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      puts(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, '>>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...', url: autoUpdater.getFeedURL() } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      puts(info, 'ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE > info >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, info: info });

      const dialogOpts = {
        type: 'info',
        buttons: ['ok'],
        title: 'Actualización disponible',
        message: 'Novac System presenta una nueva actualizacion se empezará a descargar ahora.',
        detail: `Version a descargar: ${info.version}`,
      };
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, (progress) => {
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, info: { msg: 'descarga porciento...', body: progress } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event, releaseNotes, releaseName) => {
      puts(event, 'ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED > event >>>>>>>>>>>>');
      const dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar'],
        title: 'Actualizacion descargada',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Para que las actualizaciones sean efectivas debe de reiniciar la aplicacion.',
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();

        this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, info: { msg: 'descarga finalizada...', body: returnValue } });
      });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, (info) => {
      puts(info, 'ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE > info >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info: { msg: 'Actualizacion no disponible...', body: info } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, (error) => {
      puts(error, 'ELECTRON_EVENT_UPDATE_ERROR > error >>>>>>>>>>>>');
      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_ERROR, info: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
    });
  }

  sendEventToAngular(win, params: { event_name: string; info: any }) {
    puts('-=-=-=- sendEventToAngular -=-=-=-');
    puts(win, 'win');
    if (win) win.webContents.send(KEYWORD_ELECTRON_RESPONSE, { event_name: params.event_name, info: params.info });
  }
}
