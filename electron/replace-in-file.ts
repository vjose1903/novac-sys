import * as fs from 'fs';
import { pathAdd, writeLogs } from '../main';
import Functions from './functions.js';
const logosJson = require('../logos.json');

export default class ReplaceInFile {
  constructor() {}

  // replaceFunction(params: { new_config: any; array_targets: string[]; array_replacement: string[]; logos_changes?: object }) {
  replaceFunction(params: { new_config: any; configReplacement?: any; logos_changes?: object }) {
    return new Promise((resolve, reject) => {
      const promomiseList = <any>[];

      if (params.logos_changes) promomiseList.push(this.cambiarLogos(params.logos_changes));
      if (params.configReplacement) promomiseList.push(this.cambiarHandlerConfig(params.configReplacement));

      Promise.all(promomiseList)
        .then((values) => {
          console.log('  ');
          console.log('  ');
          console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
          console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
          console.log('params ', params);
          console.log('promomiseList ', promomiseList);
          console.log('values ', values);
          console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
          console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
          console.log('  ');
          console.log('  ');

          setTimeout(() => {
            setTimeout(() => {
              Functions.setConfigFile(JSON.stringify(params.new_config)).then(() => {
                resolve({ err: false, msg: 'Archivo de configuración modificado correctamente.' });
              });
            }, 0);
          }, 0);
        })
        .catch((error) => {
          reject({ err: true, msg: 'Error modificando archivo de configuración.', error: error });
          console.error('Error occurred:', error);
        });
    });
  }

  cambiarLogos(logos_changes?: any) {
    return new Promise(async (resolve, reject) => {
      if (Functions.hasValue(logos_changes)) {
        const logos_a_cambiar = Object.keys(logos_changes);
        const promomiseLogoList = <any>[];

        try {
          logos_a_cambiar.forEach(async (logo) => {
            promomiseLogoList.push(this.remplace_files({ file_paths: [await pathAdd('/logos.json')], key: logo, source: logosJson[logo], target: logos_changes[logo] }));
          });

          Promise.all(promomiseLogoList)
            .then((value) => resolve({ body: 'Cambios en los logos listos' }))
            .catch((error) => reject(error));
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(true);
      }
    });
  }

  cambiarHandlerConfig(configReplacement: any) {
    return new Promise(async (resolve, reject) => {
      const cambios_config = Object.keys(configReplacement);
      if (Functions.hasValue(configReplacement) && Functions.hasValue(cambios_config)) {
        const promomisConfigList = <any>[];

        try {
          cambios_config.forEach(async (arg) => {
            const archivos_a_cambiar = [await pathAdd('/electron/handler-config-file.js'), await pathAdd('/electron/handler-config-file.ts')];

            promomisConfigList.push(this.remplace_files({ file_paths: archivos_a_cambiar, key: arg, source: configReplacement[arg].source, target: configReplacement[arg].target }));
          });

          Promise.all(promomisConfigList)
            .then((value) => resolve({ body: 'Cambios en handlerConfig listos' }))
            .catch((error) => reject(error));
        } catch (error) {
          reject(error);
        }
      } else {
        console.log('-=-=-=-=-=-=-=-=-=-=-=-= NO HAY CAMBIOS EN LA CONFIG -=-=-=-=-=-=-=-=-=-=-=-=');

        resolve(true);
      }
    });
  }

  remplace_files(params: { file_paths: Array<any>; source: String; target: String; key: String }) {
    return new Promise<any>((resolve, reject) => {
      try {
        for (const file_path of params.file_paths) {
          let file_data = fs.readFileSync(file_path, 'utf-8') as any;

          writeLogs("." );
          writeLogs("." );
          writeLogs("==============================================" );
          writeLogs(params.source, "params.source" );
          writeLogs(params.target, "params.target" );
          writeLogs(file_data, "file_data" );

          file_data = file_data.replaceAll(params.source, params.target);

          fs.writeFileSync(file_path, file_data, { encoding: 'utf-8' });
        }
        console.log(`ARCHIVO: ${params.key} reemplado.`);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }
}
