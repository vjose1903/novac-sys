const replace = require('replace-in-file');
import Functions from './functions.js';
import { pathAdd } from '../main';

export default class ReplaceInFile {
  constructor() {}

  replaceFunction(params: { new_config: any; array_targets: string[]; array_replacement: string[] }) {
    return new Promise((resolve, reject) => {
      const options = {
        allowEmptyPaths: true,
        //Multiple files
        files: [pathAdd('/electron/handler-config-file.js'), pathAdd('/electron/handler-config-file.ts')],

        //Replacement to make (string or regex)
        from: params.array_targets,
        to: params.array_replacement,
      };

      replace(options)
        .then((changedFiles) => {
          Functions.setConfigFile(JSON.stringify(params.new_config)).then(() => {
            resolve({ err: false, msg: 'Archivo de configuración modificado correctamente.' });
            console.log('Modified files:', changedFiles.join(', '));
          });
        })
        .catch((error) => {
          reject({ err: true, msg: 'Error modificando archivo de configuración.', error: error });
          console.error('Error occurred:', error);
        });
    });
  }
}
