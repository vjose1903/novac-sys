import { ConfigI } from '../src/app/core/interface/config-interface.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathAdd, writeLogs } from '../main.js';
import Functions from './functions.js';
import MachineId from './machine-id.js';

const logos = require('../logos.json');

export default class HandlerConfigFile {
  private static instance: HandlerConfigFile;
  private default_config: ConfigI;
  private machineId: MachineId = MachineId.getInstance();

  private constructor() {
    this.getDefaultConfig()
      .then(config => {
        this.default_config = config;
        
        this.default_config.logo_empresa = logos.logo_empresa;
        this.default_config.logo_impresion = logos.logo_impresion;

        this.default_config.machineId = this.machineId.value;

      })
      .catch(error => {
        writeLogs('ERROR al leer archivo de configuración por defecto:', error);
      });
  }

  static getInstance(): HandlerConfigFile {
    if (!HandlerConfigFile.instance) {
      HandlerConfigFile.instance = new HandlerConfigFile();
    }
    return HandlerConfigFile.instance;
  }

  getDefaultConfig() {
    return new Promise<ConfigI>((resolve, reject) => {
      try {
        const configPath = path.join(__dirname, 'default_config.json');

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
          await Functions.setConfigFile(JSON.stringify(this.default_config))  
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
  //           console.log(' ');
  //           console.log('------ ARCHIVO DE CONFIGURACION CREADO ------ ');
  //           console.log(' ');
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
