import { autoUpdater, type AppUpdater, type UpdateDownloadedEvent, type UpdateInfo } from 'electron-updater';
import { PublishConfiguration } from 'builder-util-runtime';
import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import {
  createIdleUpdateState,
  DESKTOP_EVENT_UPDATE_STATE,
  DesktopUpdateCheckSource,
  DesktopUpdateState,
  sendDesktopEvent,
} from './shared-electron-angular';

import { writeLogs } from '../main';
import { sharedState } from './shared-state';

export default class AppUpdate {
  private win: BrowserWindow | null = null;
  private readonly serve_: boolean;
  private readonly autoUpdater: AppUpdater;
  private readonly app: Electron.App;
  private updateConfig: PublishConfiguration | null = null;
  private state: DesktopUpdateState = createIdleUpdateState();
  private isInitialized = false;
  private isChecking = false;
  private isDownloading = false;

  constructor(app: Electron.App, serve_: boolean) {
    this.app = app;
    this.serve_ = serve_;
    this.autoUpdater = autoUpdater;
  }

  attachWindow(win: BrowserWindow) {
    this.win = win;
    this.emitState();
  }

  init() {
    if (this.serve_ || this.isInitialized) return;

    this.isInitialized = true;
    writeLogs(' -------- INICIALIZANDO EL SERVICIO DE ACTUALIZACIONES --------');

    const log = require('electron-log');
    log.transports.file.level = 'warn';
    log.transports.console.level = 'warn';
    this.autoUpdater.logger = log;
    this.autoUpdater.autoDownload = false;

    this.configureUpdateEvents();

    this.getUpdateConfig()
      .then(config => {
        this.updateConfig = config;
        this.autoUpdater.setFeedURL(config);
        this.checkForUpdates('auto').catch(error => {
          writeLogs(error, 'ERROR en auto-check de actualizaciones');
        });
      })
      .catch(error => {
        this.setState({
          status: 'error',
          source: 'auto',
          message: 'No se pudo cargar la configuración de actualizaciones',
          error: this.normalizeError(error),
        });
      });
  }

  async checkForUpdates(source: DesktopUpdateCheckSource = 'manual') {
    if (this.serve_) return this.getState();
    if (!this.updateConfig) throw new Error('Update feed no configurado');
    if (this.isChecking || this.isDownloading || this.state.status === 'installing') return this.getState();

    this.isChecking = true;
    this.setState({
      status: 'checking',
      source,
      message: 'Verificando actualizaciones...',
      error: null,
      checkedAt: new Date().toISOString(),
    });

    try {
      await this.autoUpdater.checkForUpdates();
      return this.getState();
    } catch (error) {
      this.setState({
        status: 'error',
        source,
        message: 'Error verificando actualizaciones',
        error: this.normalizeError(error),
      });
      throw error;
    } finally {
      this.isChecking = false;
    }
  }

  async downloadUpdate() {
    if (this.serve_) return { started: false, status: this.state.status, message: 'Updater deshabilitado en desarrollo' };
    if (this.isDownloading) return { started: true, status: this.state.status, message: 'La descarga ya está en progreso' };
    if (this.state.status !== 'available') return { started: false, status: this.state.status, message: 'No hay una actualización lista para descargar' };

    this.isDownloading = true;
    writeLogs(`El usuario aceptó instalar la versión ${this.state.updateInfo?.version ?? 'disponible'}`, 'ACTUALIZACION ACEPTADA');
    this.setState({
      ...this.state,
      status: 'downloading',
      message: 'Iniciando descarga de actualización...',
      progress: null,
      error: null,
    });
    writeLogs('Iniciando descarga de actualización', 'INICIANDO DESCARGA');

    try {
      this.autoUpdater.downloadUpdate().catch(error => {
        this.isDownloading = false;
        this.setState({
          ...this.state,
          status: 'error',
          message: 'Error durante la descarga de la actualización',
          error: this.normalizeError(error),
        });
      });

      return { started: true, status: 'downloading' as const, message: 'Descarga iniciada correctamente' };
    } catch (error) {
      this.isDownloading = false;
      this.setState({
        ...this.state,
        status: 'error',
        message: 'Error iniciando la descarga',
        error: this.normalizeError(error),
      });
      throw error;
    }
  }

  getState() {
    return {
      ...this.state,
      progress: this.state.progress ? { ...this.state.progress } : null,
      error: this.state.error ? { ...this.state.error } : null,
    };
  }

  private getUpdateConfig() {
    return new Promise<PublishConfiguration>((resolve, reject) => {
      try {
        const configPath = path.join(__dirname, 'update-config.json');

        if (!fs.existsSync(configPath)) {
          reject(new Error('No se encuentra el archivo de configuración de actualizaciones'));
          return;
        }

        const configData = fs.readFileSync(configPath, 'utf-8');
        resolve(JSON.parse(configData));
      } catch (error) {
        reject(error);
      }
    });
  }

  private configureUpdateEvents() {
    this.autoUpdater.on('checking-for-update', () => {
      this.setState({
        ...this.state,
        status: 'checking',
        message: 'Verificando actualizaciones...',
      });
    });

    this.autoUpdater.on('update-available', (info: UpdateInfo) => {
      writeLogs(`Versión disponible: ${info.version}`, 'ACTUALIZACION ENCONTRADA');
      this.setState({
        status: 'available',
        source: this.state.source,
        updateInfo: info,
        progress: null,
        checkedAt: new Date().toISOString(),
        message: `Actualización disponible: ${info.version}`,
        error: null,
      });
    });

    this.autoUpdater.on('update-not-available', info => {
      this.setState({
        status: 'not-available',
        source: this.state.source,
        updateInfo: info,
        progress: null,
        checkedAt: new Date().toISOString(),
        message: 'No hay actualizaciones disponibles',
        error: null,
      });
    });

    this.autoUpdater.on('download-progress', progress => {
      if (!Number.isFinite(progress.total) || progress.total <= 0) return;

      this.setState({
        ...this.state,
        status: 'downloading',
        progress: {
          transferred: progress.transferred,
          total: progress.total,
          percent: progress.percent,
          bytesPerSecond: progress.bytesPerSecond,
        },
        message: 'Descargando actualización...',
        error: null,
      });
    });

    this.autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
      this.isDownloading = false;
      this.setState({
        ...this.state,
        status: 'downloaded',
        message: 'Descarga completada. Preparando instalación...',
        updateInfo: event,
      });

      this.installDownloadedUpdate();
    });

    this.autoUpdater.on('before-quit-for-update' as any, () => {
      sharedState.closingReason = 'update-install';
      this.setState({
        ...this.state,
        status: 'installing',
        message: 'Instalando actualización...',
      });
    });

    this.autoUpdater.on('error', error => {
      this.isChecking = false;
      this.isDownloading = false;
      this.setState({
        ...this.state,
        status: 'error',
        message: 'Error en el proceso de actualización',
        error: this.normalizeError(error),
      });
      writeLogs(error, 'ELECTRON_EVENT_UPDATE_ERROR');
    });
  }

  private installDownloadedUpdate() {
    sharedState.closingReason = 'update-install';
    this.setState({
      ...this.state,
      status: 'installing',
      message: 'Cerrando aplicación para instalar actualización...',
    });

    if (this.win && !this.win.isDestroyed()) {
      this.win.setClosable(true);
    }

    setTimeout(() => {
      try {
        BrowserWindow.getAllWindows().forEach(window => {
          if (!window.isDestroyed()) window.destroy();
        });
        this.win = null;
        this.autoUpdater.quitAndInstall(false, true);
      } catch (error) {
        writeLogs(error, 'ERROR ejecutando quitAndInstall');
        this.app.quit();
      }
    }, 300);
  }

  private setState(state: DesktopUpdateState) {
    this.state = {
      ...state,
      progress: state.progress ?? null,
      checkedAt: state.checkedAt ?? this.state.checkedAt ?? null,
      error: state.error ?? null,
    };
    this.emitState();
  }

  private emitState() {
    sendDesktopEvent(this.win, {
      eventName: DESKTOP_EVENT_UPDATE_STATE,
      payload: this.getState(),
    });
  }

  private normalizeError(error: any) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack || null,
      };
    }

    return {
      message: typeof error === 'string' ? error : JSON.stringify(error),
      stack: null,
    };
  }
}
