import { autoUpdater, type UpdateDownloadedEvent, type AppUpdater, UpdateCheckResult, UpdateInfo } from 'electron-updater';
import { PublishConfiguration } from 'builder-util-runtime';
import * as fs from 'fs';
import * as path from 'path';

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
  updateConfig: PublishConfiguration;

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

      this.getUpdateConfig()
        .then(config => {
          this.updateConfig = config;
          this.initializeUpdatesEvents();
        })
        .catch(error => {
          writeLogs('ERROR al obtener la configuración de actualizaciones:', error);
        });
    }
  }

  getUpdateConfig() {
    return new Promise<PublishConfiguration>((resolve, reject) => {
      try {
        const configPath = path.join(__dirname, 'update-config.json');

        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          resolve(JSON.parse(configData));
        } else {
          writeLogs('ADVERTENCIA: No se encuentra el archivo de configuración de actualizaciones.');
          reject(new Error('No se encuentra el archivo de configuración de actualizaciones'));
        }
      } catch (error) {
        writeLogs('ERROR al leer archivo de configuración de actualizaciones:', error);
        reject(error);
      }
    });
  }

  async initializeUpdatesEvents() {
    this.autoUpdater.setFeedURL(this.updateConfig);

    // Configurar para que no descargue automáticamente
    this.autoUpdater.autoDownload = false;

    // Configurar todos los eventos primero
    await this.configureUpdateEvents();

    // Ahora que todos los eventos están configurados, verificar actualizaciones
    this.autoUpdater.checkForUpdates();
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // AUTO UPDATE EVENTS
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  configureUpdateEvents() {
    // Mover todos los eventos a este método
    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, info => {
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE, data: { msg: 'Actualizacion no disponible...', body: info } });
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, (info: any) => {
      // Ahora solo enviamos la información al front y dejamos que el usuario decida
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, data: info });
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, (event: UpdateDownloadedEvent) => {
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED, data: { msg: 'descarga finalizada...' } });

      // Limpiar todos los listeners y procesos antes de instalar
      this.prepareForUpdate();
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, () => {
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE, data: { msg: 'verificando actualizacion...', url: this.autoUpdater.getFeedURL() } });
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, progress => {
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, data: { msg: 'descarga porciento...', body: progress } });
    });

    this.autoUpdater.on(ELECTRON_EVENT_UPDATE_ERROR, error => {
      writeLogs(error, 'ELECTRON_EVENT_UPDATE_ERROR');
      SharedElectronAngular.sendEventToAngular(this.win, { eventName: ELECTRON_EVENT_UPDATE_ERROR, data: { msg: 'Error en la actualizacion...', body: { msg: 'Error descargando actualizacion...', body: error } } });
    });

    // Evento específico para antes de cerrar la aplicación para actualización
    this.autoUpdater.on('before-quit-for-update' as any, () => {
      writeLogs('Preparando para cerrar aplicación y actualizar...', 'before-quit-for-update');
      // Configurar la variable global para indicar que estamos cerrando para actualizar
      sharedState.isUpdaterClosing = true;

      // Asegurar que la ventana principal sea cerrable
      if (this.win && !this.win.isDestroyed()) {
        this.win.setClosable(true);
        writeLogs('Ventana principal configurada como cerrable antes de actualización', 'before-quit-for-update');
      }
    });
  }

  async downloadUpdate() {
    return new Promise((resolve, reject) => {
      try {
        // Configurar un listener temporal para detectar cuando inicia la descarga
        const onDownloadStart = () => {
          writeLogs('Descarga iniciada exitosamente');
          this.autoUpdater.off(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, onDownloadStart);
          resolve({ success: true, msg: 'Descarga iniciada' });
        };

        const onError = error => {
          writeLogs('ERROR al iniciar descarga:', error);
          this.autoUpdater.off(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, onDownloadStart);
          this.autoUpdater.off(ELECTRON_EVENT_UPDATE_ERROR, onError);
          reject(error);
        };

        // Escuchar cuando inicia la descarga (primer evento de progreso)
        this.autoUpdater.once(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, onDownloadStart);
        this.autoUpdater.once(ELECTRON_EVENT_UPDATE_ERROR, onError);

        // Iniciar la descarga
        this.autoUpdater.downloadUpdate();

        // Timeout de seguridad en caso de que no se dispare ningún evento
        setTimeout(() => {
          this.autoUpdater.off(ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS, onDownloadStart);
          this.autoUpdater.off(ELECTRON_EVENT_UPDATE_ERROR, onError);
          reject(new Error('Timeout: No se pudo iniciar la descarga'));
        }, 30000); // 10 segundos de timeout
      } catch (error) {
        writeLogs('ERROR al descargar actualización:', error);
        reject(error);
      }
    });
  }

  async verifyUpdateAvailable(args?: { notify?: boolean }) {
    return new Promise<UpdateInfo | null>((resolve, reject) => {
      const { notify = true } = args || {};
      // Si notify es false, temporalmente deshabilitar el evento de actualización disponible
      let originalHandler: any = null;
      if (!notify) {
        // Guardar el handler original
        originalHandler = this.autoUpdater.listeners(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE)[0];
        // Remover temporalmente el listener
        this.autoUpdater.removeAllListeners(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE);
      }

      try {

        this.autoUpdater
          .checkForUpdates()
          .then(res => {
            setTimeout(() => {
              // Restaurar el handler original si se había removido
              if (!notify && originalHandler) {
                this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, originalHandler);
              }

              if (res) {
                resolve(res.updateInfo);
              } else {
                resolve(null);
              }
            }, 1000);
          })
          .catch(error => {
            // Restaurar el handler original en caso de error
            if (!notify && originalHandler) {
              this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, originalHandler);
            }
            writeLogs('Error al verificar actualizaciones:', error);
            reject(error);
          });
      } catch (error) {
        // Restaurar el handler original en caso de error
        if (!notify && originalHandler) {
          this.autoUpdater.on(ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE, originalHandler);
        }
        writeLogs('Error en verifyUpdateAvailable:', error);
        reject(error);
      }
    });
  }

  /**
   * Prepara la aplicación para la actualización limpiando listeners y procesos
   */
  private prepareForUpdate() {
    writeLogs('Preparando aplicación para actualización...', 'prepareForUpdate');

    try {
      // Cerrar splash handler si existe
      const { SplashHandler } = require('./splash-handler');
      if (SplashHandler && SplashHandler.getInstance) {
        const splashHandler = SplashHandler.getInstance();
        if (splashHandler && splashHandler.closeSplash) {
          splashHandler.closeSplash();
        }
      }

      // Remover listeners que puedan interferir con el proceso de actualización
      if (this.win) {
        this.win.removeAllListeners('closed');
        this.win.removeAllListeners('before-unload');
      }

      // Remover listeners de la aplicación
      const { app } = require('electron');
      app.removeAllListeners('window-all-closed');
      app.removeAllListeners('before-quit');

      // Timeout de seguridad para forzar el cierre si quitAndInstall falla
      setTimeout(() => {
        writeLogs('Timeout de seguridad: forzando cierre de la aplicación', 'prepareForUpdate');
        app.quit();
      }, 5000);

      // Ejecutar quitAndInstall - el evento before-quit-for-update ya configuró la ventana
      writeLogs('Ejecutando quitAndInstall...', 'prepareForUpdate');
      this.autoUpdater.quitAndInstall();
    } catch (error) {
      writeLogs(`Error preparando actualización: ${error}`, 'prepareForUpdate');
      // Si hay error, intentar cerrar la aplicación de todas formas
      const { app } = require('electron');
      app.quit();
    }
  }
}
