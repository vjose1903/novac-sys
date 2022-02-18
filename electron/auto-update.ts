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

export default class AppUpdater {
  constructor() {
    const log = require('electron-log');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();

    console.log('------ AppUpdater Constructor ------');
  }

  handleUpdateEvents(win: BrowserWindow) {
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // AUTO UPDATE EVENTS
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    console.log('------ AppUpdater handleUpdateEvents ------');
    setTimeout(() => this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...' } }), 10000);

    autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      console.log('----- ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE ------ ');

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, info: { msg: 'verificando actualizacion...' } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      console.log('----- ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE ------ ');

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, info: info });

      const dialogOpts = {
        type: 'info',
        buttons: ['ok'],
        title: 'Actualización disponible',
        message: 'VjPOS presenta una nueva actualizacion se empezará a descargar ahora.',
        detail: `Version a descargar: ${info.version}`,
      };
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, (progress) => {
      console.log('----- ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS ------ ');

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, info: { msg: 'descarga porciento...', body: progress } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event, releaseNotes, releaseName) => {
      console.log('----- ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED ------ ');

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
      console.log('----- ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE ------ ');

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info: { msg: 'Actualizacion no disponible...', body: info } });
    });

    autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, (error) => {
      console.log('----- ELECTRON_EVENT_UPDATE_ERROR ------ ');

      this.sendEventToAngular(win, { event_name: ELECTRON_EVENT_UPDATE_ERROR, info: { msg: 'Actualizacion no disponible...', body: { msg: 'Error descargando actualizacion...', body: error } } });
    });
  }

  sendEventToAngular(win, params: { event_name: string; info: any }) {
    if (win) {
      console.log('Enviando evento a angular');
      win.webContents.send(KEYWORD_ELECTRON_RESPONSE, { event_name: params.event_name, info: params.info });
    }
  }
}
