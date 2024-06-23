import { cmd, writeLogs } from '../main';

export default class DockerHandler {
  count_docker;
  count_db;
  constructor() {
    this.count_docker = 1;
    this.count_db = 1;
  }

  async checkAllInDocker(first_resolve:any = null, first_reject:any = null) {
    return new Promise<any>((resolve, reject) => {
      first_resolve ||= resolve;
      first_reject ||= reject;

      if (this.count_docker <= 20 && this.count_db <= 20) {
        cmd('docker ps --filter "name=agrodemi-dev" --format "{{.Status}}"', (res) => {
          if (res.status) {
            if (this.count_db == 1) writeLogs('Docker esta corriendo perfectamente.');

            if (res.STDOUT.toLowerCase().includes('up')) {
              writeLogs('Base de datos esta corriendo perfectamente.');
              setTimeout(() => first_resolve('Todo Listo en docker'), 1000);
            } else {
              writeLogs(res.STDERR, `ERROR: base de datos presenta fallos, intento #: ${this.count_db}`);
              this.count_db += 1;
              setTimeout(() => this.checkAllInDocker(first_resolve, first_reject), 1000);
            }
          } else {
            writeLogs(res.STDERR, `ERROR: docker presenta fallos, intento #: ${this.count_docker}`);
            this.count_docker += 1;
            setTimeout(() => this.checkAllInDocker(first_resolve, first_reject), 1000);
          }
        });
      } else {
        const type_error = this.count_db > 20 ? 'db' : 'docker';

        first_reject(type_error);
      }
    });
  }
}
