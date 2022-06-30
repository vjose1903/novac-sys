const replace = require('replace-in-file');
import Functions from './functions.js';
import { pathAdd, cmd } from '../main';
const logosJson = require('../logos.json');

export default class ReplaceInFile {
  constructor() {}

  replaceFunction(params: { new_config: any; array_targets: string[]; array_replacement: string[]; logos_changes?: object }) {
    return new Promise((resolve, reject) => {
      const promomiseList = [];

      promomiseList.push(this.cambiarLogos(params.logos_changes));
      promomiseList.push(this.cambiarHandlerConfig(params));

      Promise.all(promomiseList)
        .then((values) => {
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
    return new Promise((resolve, reject) => {
      if (Functions.hasValue(logos_changes)) {
        const logos_a_cambiar = Object.keys(logos_changes);
        const logos_sources = [];
        const logos_replacement = [];

        logos_a_cambiar.forEach((logo) => {
          logos_sources.push(`"${logo}": "${logosJson[logo]}"`);
          logos_replacement.push(`"${logo}": "${logos_changes[logo]}"`);
        });

        const options_logo = { allowEmptyPaths: true, files: [pathAdd('/logos.json')], from: logos_sources, to: logos_replacement };

        replace(options_logo)
          .then((changedFiles) => {
            resolve(changedFiles);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve(true);
      }
    });
  }

  cambiarHandlerConfig(params: { new_config: any; array_targets: string[]; array_replacement: string[] }) {
    return new Promise(async (resolve, reject) => {
      if (Functions.hasValue(params.array_replacement) && Functions.hasValue(params.array_targets)) {
        const archivos_a_cambiar = [await pathAdd('/electron/handler-config-file.js'), await pathAdd('/electron/handler-config-file.ts')];
        const options = { allowEmptyPaths: true, files: archivos_a_cambiar, from: params.array_targets, to: params.array_replacement };

        replace(options)
          .then((changedFiles) => resolve(changedFiles))
          .catch((error) => reject(error));
      } else {
        resolve(true);
      }
    });
  }
}
