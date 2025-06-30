import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { writeLogs } from '../main';

// Enum para tipos de errores
export enum ErrorType {
  FIREBASE_CONFIG = 'firebase_config',
  DATABASE_LOCAL = 'database_local',
  CONFIG_FILE = 'config_file',
  DOCKER = 'docker',
  UNKNOWN = 'unknown',
}

// Interfaz para errores tipados
export interface TypedError extends Error {
  type: ErrorType;
  originalError?: any;
}

// Mapa de errores a tipos de splash
const ERROR_SPLASH_MAP: Record<ErrorType, string> = {
  [ErrorType.FIREBASE_CONFIG]: 'splash_config_error',
  [ErrorType.DATABASE_LOCAL]: 'splash_db_error',
  [ErrorType.CONFIG_FILE]: 'splash_config_error',
  [ErrorType.DOCKER]: 'splash_docker_error',
  [ErrorType.UNKNOWN]: 'splash_error_desconocido',
};

export default class SplashHandler {
  private static instance: SplashHandler;
  private splash: BrowserWindow | null = null;
  private serve: boolean;
  private iconPath: string;

  private constructor(serve: boolean, iconPath: string) {
    this.serve = serve;
    this.iconPath = iconPath;
  }

  static getInstance(serve: boolean, iconPath: string): SplashHandler {
    if (!SplashHandler.instance) {
      SplashHandler.instance = new SplashHandler(serve, iconPath);
    }
    return SplashHandler.instance;
  }

  /**
   * Crea un splash screen del tipo especificado
   * Retorna una promesa que se resuelve cuando el splash de carga se completa exitosamente
   * o se rechaza si hay un error
   */
  createSplash(type: string = 'splash'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.splash) {
        this.splash.close();
        this.splash = null;
      }

      writeLogs(' ----- CREATE SPLASH ------');
      writeLogs(`Tipo de splash: ${type}`, 'createSplash');

      this.splash = new BrowserWindow({
        width: 650,
        minWidth: 650,
        height: 500,
        minHeight: 500,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        icon: this.iconPath,
        show: false, // No mostrar hasta que esté listo
      });

      const splashUrl = `file://${path.join(process.cwd(), this.serve ? 'src/splash' : 'dist/browser/splash', `${type}.html`)}`;

      this.splash.loadURL(splashUrl);
      this.splash.show();
      this.splash.center();

      // Manejar errores de carga
      this.splash.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        writeLogs(`Error cargando splash: ${errorCode} - ${errorDescription}`, 'createSplash');
        reject(new Error(`Error cargando splash: ${errorCode} - ${errorDescription}`));
      });

      this.splash.webContents.on('did-finish-load', () => {
        if (type === 'splash') {
          resolve(); // Resolver la promesa cuando el splash de carga esté listo
        } else {
          // Para splash de error, cerrar después de un tiempo
          shell.beep();
          setTimeout(() => {
            this.splash?.close();
            process.exit(1);
          }, 6000);
        }
      });
    });
  }

  /**
   * Crea un splash de error basado en el tipo de error
   */
  createErrorSplash(error: any): void {
    const errorType = this.determineErrorType(error);
    const splashType = ERROR_SPLASH_MAP[errorType];

    writeLogs(error, `ERROR - Tipo: ${errorType}`);
    this.createSplash(splashType);
  }

  /**
   * Cierra el splash actual
   */
  closeSplash(): void {
    if (this.splash) {
      this.splash.close();
      this.splash = null;
    }
  }

  /**
   * Función para crear errores tipados
   */
  createTypedError(message: string, type: ErrorType, originalError?: any): TypedError {
    const error = new Error(message) as TypedError;
    error.type = type;
    error.originalError = originalError;
    return error;
  }

  /**
   * Función para determinar el tipo de error basado en el error original
   */
  private determineErrorType(error: any): ErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('firebase') || message.includes('config')) {
        return ErrorType.FIREBASE_CONFIG;
      }

      if (message.includes('database') || message.includes('db')) {
        return ErrorType.DATABASE_LOCAL;
      }

      if (message.includes('docker')) {
        return ErrorType.DOCKER;
      }
    }

    // Si es un string que contiene información específica
    if (typeof error === 'string') {
      if (error.includes('db')) {
        return ErrorType.DATABASE_LOCAL;
      }
      if (error.includes('docker')) {
        return ErrorType.DOCKER;
      }
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Obtiene el tipo de splash para un tipo de error específico
   */
  getSplashTypeForError(errorType: ErrorType): string {
    return ERROR_SPLASH_MAP[errorType];
  }

  /**
   * Verifica si hay un splash activo
   */
  hasActiveSplash(): boolean {
    return this.splash !== null;
  }
}
