import { ConfigI } from '../src/app/core/interface/config-interface.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathAdd, writeLogs } from '../main.js';
import Functions from './functions.js';
import MachineId from './machine-id.js';

function resolveRuntimeFile(packagedPath: string, sourcePath: string): string {
  return fs.existsSync(packagedPath) ? packagedPath : sourcePath;
}

const logosPath = resolveRuntimeFile(path.join(__dirname, '..', 'logos.json'), path.join(process.cwd(), 'logos.json'));
const logos = JSON.parse(fs.readFileSync(logosPath, 'utf-8'));

export default class HandlerConfigFile {
  private static instance: HandlerConfigFile;
  private static initPromise: Promise<HandlerConfigFile>;
  private _default_config: ConfigI;

  get default_config() {
    return this._default_config;
  }

  private constructor() {}

  static getInstance(machineId: MachineId): Promise<HandlerConfigFile> {
    if (!HandlerConfigFile.initPromise) {
      HandlerConfigFile.initPromise = HandlerConfigFile.createInstance(machineId);
    }
    return HandlerConfigFile.initPromise;
  }

  private static async createInstance(machineId: MachineId): Promise<HandlerConfigFile> {
    if (!HandlerConfigFile.instance) {
      HandlerConfigFile.instance = new HandlerConfigFile();
      await HandlerConfigFile.instance.initialize(machineId);
    }
    return HandlerConfigFile.instance;
  }

  private async initialize(machineId: MachineId): Promise<void> {
    try {
      const config = await this.getDefaultConfig();

      this._default_config = config;
      this._default_config.logo_empresa = logos.logo_empresa;
      this._default_config.logo_impresion = logos.logo_impresion;

      this._default_config.machineId = machineId.value;
    } catch (error) {
      writeLogs('ERROR al leer archivo de configuración por defecto:', error);
      throw error;
    }
  }

  getDefaultConfig() {
    return new Promise<ConfigI>((resolve, reject) => {
      try {
        const configPath = resolveRuntimeFile(path.join(__dirname, 'default_config.json'), path.join(process.cwd(), 'electron', 'default_config.json'));

        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          resolve(JSON.parse(configData));
        } else {
          writeLogs('ADVERTENCIA: No se encuentra el archivo de configuración por defecto.');
          reject(new Error('No se encuentra el archivo de configuración por defecto'));
        }
      } catch (error) {
        writeLogs('ERROR al leer archivo de configuración por defecto:', error);
        reject(error);
      }
    });
  }

  configFileExists(args?: { create_if_not_exists: boolean }): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      const config_path = await pathAdd('/app_config.config');

      const file_exists = fs.existsSync(config_path);

      if (args?.create_if_not_exists && !file_exists) {
        try {
          await Functions.setConfigFile(JSON.stringify(this._default_config));
          resolve(true);
        } catch (error) {
          reject(false);
        }
      }

      resolve(file_exists);
    });
  }

  // checkConfigFile(): Promise<any> {
  //   return new Promise<any>(async (resolve, reject) => {
  //     const existe_archivo_config = await this.configFileExists();

  //     writeLogs(existe_archivo_config, ':::::::: existe_archivo_config');

  //     if (!existe_archivo_config) {
  //       Functions.setConfigFile(JSON.stringify(this.default_config))
  //         .then(() => {
  //           writeLogs('------ ARCHIVO DE CONFIGURACION CREADO ------');

  //           setTimeout(() => resolve(true), 500);
  //         })
  //         .catch(err => reject(false));
  //     } else {
  //       setTimeout(() => resolve(true), 500);
  //     }
  //   });
  // }
}
