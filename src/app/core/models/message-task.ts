import { BehaviorSubject } from 'rxjs';
import { fun } from '../services/functions.service';

export class MessageTask {
  id: string;
  eventName: string;
  data: any;
  error: boolean;

  fn = new BehaviorSubject<any>({});

  constructor(eventName: string, data: string | object = '') {
    this.id = fun.generateKey();
    this.eventName = eventName;
    this.data = typeof data === 'string' ? data : JSON.stringify(data);
  }

  generateDataKey(arrRes: any, hash?: any): any {
    return fun.map(arrRes, (el: any) => {
      if (el.data) {
        return { data: el.data, key: fun.generateKey() };
      } else {
        return { data: el, key: hash || fun.generateKey() };
      }
    });
  }

  asJson(): any {
    return { id: this.id, eventName: this.eventName, data: this.data, error: this.error };
  }

  serialize(): string {
    return JSON.stringify(this.asJson());
  }
}
