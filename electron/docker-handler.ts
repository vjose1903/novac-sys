import Functions from './functions';
import { ConfigI } from '../src/app/core/typescript/config-interface';
import { cmd, puts } from '../main';

export default class DockerHandler {
  count;
  constructor() {
    this.count = 1;
  }

  async checkAllInDocker(first_resolve = null, first_reject = null) {
    return new Promise<any>((resolve, reject) => {
      first_resolve ||= resolve;
      first_reject ||= reject;

      if (this.count < 100) {
        cmd('docker-compose ls -a', (res) => {
          if (res.status) {
            puts('Docker esta corriendo perfectamente.');
            first_resolve({ body: res, type: 'docker' });
          } else {
            puts(res.STDERR, `ERROR: docker presenta fallos, intento #: ${this.count}`);
            this.count += 1;
            setTimeout(() => this.checkAllInDocker(first_resolve, first_reject), 1000);
          }
        });
      } else {
        first_reject('docker');
      }
    });
  }
}
