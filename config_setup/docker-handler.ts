import { runTerminalCommand, writeLogs } from '../main';

export default class DockerHandler {
  private static instance: DockerHandler;
  count_docker;
  count_db;
  is_db_local_running: boolean = false;

  private constructor() {
    this.count_docker = 1;
    this.count_db = 1;
  }

  public static getInstance(): DockerHandler {
    if (!DockerHandler.instance) {
      DockerHandler.instance = new DockerHandler();
    }
    return DockerHandler.instance;
  }

  async checkAllInDocker(first_resolve: any = null, first_reject: any = null) {
    return new Promise<any>((resolve, reject) => {
      first_resolve ||= resolve;
      first_reject ||= reject;

      if (this.count_docker <= 20 && this.count_db <= 20) {
        runTerminalCommand('docker ps --filter "name=$$DOCKER_NAME$$" --format "{{.Status}}"')
          .then(res => {
            if (res.STDOUT.toLowerCase().includes('up')) {
              setTimeout(() => {
                this.is_db_local_running = true;
                first_resolve('Todo Listo en docker');
              }, 1000);
            } else {
              writeLogs(res.STDERR, `ERROR: base de datos presenta fallos, intento #: ${this.count_db}`);
              this.count_db += 1;
              setTimeout(() => this.checkAllInDocker(first_resolve, first_reject), 1000);
            }
          })
          .catch(err => {
            writeLogs(err.STDERR, `ERROR: docker presenta fallos, intento #: ${this.count_docker}`);
            this.count_docker += 1;
            setTimeout(() => this.checkAllInDocker(first_resolve, first_reject), 1000);
          });
      } else {
        const type_error = this.count_db > 20 ? 'db' : 'docker';

        first_reject(type_error);
      }
    });
  }
}
