import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
import { SingletonService } from '../services/singleton.service';

export class MessageTask {
  id: string;
  eventName: string;
  data: any;
  fun = SingletonService.fun;
  fn = new BehaviorSubject<any>({});

  constructor(eventName: string, data: string | object = '') {
    console.log('eventName --> ', eventName);

    this.id = this.generateKey();
    this.eventName = eventName;
    this.data = typeof data === 'string' ? data : JSON.stringify(data);
  }

  generateDataKey(arrRes: any, hash?: any): any {
    return _.map(arrRes, (el: any) => {
      if (el.data) {
        return { data: el.data, key: this.generateKey() };
      } else {
        return { data: el, key: hash || this.generateKey() };
      }
    });
  }

  generateKey(): string {
    return moment().unix() + '' + Math.round(Math.random() * 10000);
  }

  asJson(): any {
    return { id: this.id, eventName: this.eventName, data: this.data };
  }

  serialize(): string {
    return JSON.stringify(this.asJson());
  }
}
