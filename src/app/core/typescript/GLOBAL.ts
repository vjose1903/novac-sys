import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import * as _ from 'lodash';

export const MODIFIED_CONFIG_FILE = new BehaviorSubject<any>(null);
export const ELECTRON_EVENTS_OBSERVER = new BehaviorSubject<any>(null);

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null));
    });
  });
}

export const tipos_facturas = {
  'factura sin comprobante': '00',
  'factura con valor fiscal': '01',
  'factura de consumo': '02',
  'comprobante de compras': '11',
  'registro de unico ingreso': '12',
  'comprobante para gastos menores': '13',
  'comprobante de regimen especiales': '14',
  'comprobante gubernamental': '15',
  'comprobante para exportaciones': '16',
  'comprobantes para pago al exterior': '17',
};

export class GLOBAL {}

export const showLoadin = new BehaviorSubject<boolean>(false);
