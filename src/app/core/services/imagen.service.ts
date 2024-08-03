import { Injectable } from '@angular/core';
import { getUrlInUse } from '../typescript/url-server.utils';
import { Ss } from './singleton.service';
import { fun } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class ImagenService {
  constructor() {}

  getImgUrlServer(fileName: string) {
    return fileName ? `${getUrlInUse()}/img/${fileName}` : null;
  }

  getDivisaInfoById(id: number, property?: string) {
    const divisa = Ss.divisaServ.getDivisaInfoById(id);
    return fun.hasValue(property) ? fun.getProperty(divisa, property) : divisa;
  }
}
