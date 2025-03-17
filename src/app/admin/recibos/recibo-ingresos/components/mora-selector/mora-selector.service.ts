import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class MoraSelectorService {
  private _porcentajeMora: BehaviorSubject<number> = new BehaviorSubject<number>(2);

  get porcentajeMora$(): Observable<number> {
    return this._porcentajeMora.asObservable();
  }

  setPorcentajeMora(porcentaje: number) {
    this._porcentajeMora.next(porcentaje);
  }
}

export enum MoraSelectorKeyI {
  mora = 'mora',
  porcentaje_mora = 'porcentaje_mora',
}
