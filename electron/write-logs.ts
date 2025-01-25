import * as fs from 'fs';
import { pathAdd } from '../main';

type LogTask = {
  titulo?: string;
  texto: string;
};

export default class LogProcessor {
  private static instance: LogProcessor;
  private queue: LogTask[] = [];
  private isProcessing = false;
  private logDirPath: string;
  private logFilePath: string;

  private constructor() {
    this.initVars();
  }

  // Singleton para garantizar una única instancia
  public static getInstance(): LogProcessor {
    if (!LogProcessor.instance) {
      LogProcessor.instance = new LogProcessor();
    }
    return LogProcessor.instance;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // MÉTODO PARA INICIALIZAR LAS VARIABLES
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private async initVars() {
    this.logDirPath = await pathAdd('/log');
    this.logFilePath = await pathAdd('/log/my_log.txt');
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // MÉTODO PARA AGREGAR UN LOG A LA COLA Y PROCESARLO
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public async log(msg: string | object | number, titulo?: string): Promise<void> {
    const texto = this.formatMessage(msg);

    await this.ensureLogDirectoryExists();

    this.enqueueTask({ titulo, texto });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // FORMATEA EL MENSAJE EN FUNCIÓN DEL TIPO
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private formatMessage(msg: string | object | number): string {
    if (typeof msg === 'object') {
      return JSON.stringify(msg, null, '\t');
    }
    return msg.toString();
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // ASEGURA QUE EL DIRECTORIO DE LOGS EXISTA
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private async ensureLogDirectoryExists(): Promise<void> {
    try {
      if (!fs.existsSync(this.logDirPath)) {
        await fs.promises.mkdir(this.logDirPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error al crear el directorio de logs:', error.message);
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // AGREGA UNA TAREA A LA COLA
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private enqueueTask(task: LogTask): void {
    this.queue.push(task);
    this.processQueue();
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // PROCESA LAS TAREAS EN LA COLA EN ORDEN
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const task = this.queue.shift();
    if (!task) {
      this.isProcessing = false;
      return;
    }

    const { titulo, texto } = task;

    try {
      if (!fs.existsSync(this.logFilePath)) {
        const stream = fs.createWriteStream(this.logFilePath);
        await this.writeLog(stream, titulo, texto);
      } else {
        await fs.promises.appendFile(this.logFilePath, `${titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`}`);
      }
    } catch (error) {
      console.error(`Error procesando log: ${error.message}`);
    }

    this.isProcessing = false;
    this.processQueue();
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // FUNCIÓN PARA ESCRIBIR EN EL ARCHIVO DE LOG USANDO UN STREAM
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private writeLog(stream: fs.WriteStream, titulo: string | undefined, texto: string): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.once('open', () => {
        stream.write(titulo ? `\n ${titulo}  ==╗ \n      ${texto} \n` : `\n${texto} \n`);
        stream.end();
        resolve();
      });
      stream.on('error', reject);
    });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // LIMPIA EL ARCHIVO DE LOGS
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  public async clean(): Promise<void> {
    try {
      if (fs.existsSync(this.logFilePath)) {
        await fs.promises.unlink(this.logFilePath);
        console.log('Archivo de log eliminado.');
      }
    } catch (error) {
      console.error('Error al limpiar el archivo de log:', error.message);
    }
  }
}
