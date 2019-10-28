import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticulosService {
  private articulos = new BehaviorSubject<any>(undefined);

  ARTICULOS = this.articulos.asObservable();
  constructor() {}

  next_articulo(nextValue) {
    const obj = JSON.parse(JSON.stringify(nextValue));
    this.articulos.next(nextValue);
  }
}
