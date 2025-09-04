export const pattern = {
  phone: ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
  cedula: [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/],
  rnc: [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/],
};

export enum serie {
  no = 0,
  normal = 'normal',
  electronica = 'electronica',
  all = 'all',
}

export enum TrackStatusEnum {
  NOT_FOUND = 'No encontrado',
  ACCEPTED = 'Aceptado',
  REJECTED = 'Rechazado',
  IN_PROCESS = 'En Proceso',
  CONDITIONAL_ACCEPTED = 'Aceptado Condicional',
}

export interface seriesDgiiI {
  label: string;
  value: serie;
  disabled?: boolean;
}

export const seriesDGII = (args?: { includeAll?: boolean; disableNormal?: boolean; disableElectronica?: boolean; disableAll?: boolean }): seriesDgiiI[] => {
  args ??= {};
  args.includeAll ??= false;
  args.disableNormal ??= false;
  args.disableElectronica ??= false;
  args.disableAll ??= false;

  const list: seriesDgiiI[] = [
    { label: 'Normal', value: serie.normal, disabled: args.disableNormal },
    { label: 'Electronica', value: serie.electronica, disabled: args.disableElectronica },
  ];

  if (args.includeAll) list.unshift({ label: 'Todas', value: serie.all, disabled: args.disableAll });

  return list;
};

export enum operativeSystemE {
  windows = 'windows',
  macOs = 'macOs',
}

export const booleanYesNo = [
  { label: 'Si', value: true, disabled: false },
  { label: 'No', value: false, disabled: false },
];

export enum TypeNavigation {
  first_access = 0,
  reload = 1,
  back_forward = 2,
}

export enum unidadAbrev {
  barril = 'BARR',
  bolsa = 'BOL',
  botella = 'BOTELLA',
  caja = 'CAJ',
  docena = 'DOC',
  fardo = 'FARD',
  galon = 'GL',
  kilogramo = 'KG',
  libra = 'LB',
  litro = 'LITRO',
  tanque = 'TANQUE',
  unidad = 'UND',
  saco = 'SAC',
  quintal = ' Q',
  miligramo = 'MG',
  onzas = 'OZ',
}

export enum teclasCode {
  _esc = 27,
  _derecha = 39,
  _izquierda = 37,
  _arriba = 38,
  _abajo = 40,
  _enter = 13,
  _control = 17,
  _shift = 16,
  _alt = 18,

  _0 = 48,
  _1 = 49,
  _2 = 50,
  _3 = 51,
  _4 = 52,
  _5 = 53,
  _6 = 54,
  _7 = 55,
  _8 = 56,
  _9 = 57,

  _A = 65,
  _B = 66,
  _C = 67,
  _D = 68,
  _E = 69,
  _F = 70,
  _G = 71,
  _H = 72,
  _I = 73,
  _J = 74,
  _K = 75,
  _L = 76,
  _M = 77,
  _N = 78,
  _O = 79,
  _P = 80,
  _Q = 81,
  _R = 82,
  _S = 83,
  _T = 84,
  _U = 85,
  _V = 86,
  _W = 87,
  _X = 88,
  _Y = 89,
  _Z = 90,

  _a = 97,
  _b = 98,
  _c = 99,
  _d = 100,
  _e = 101,
  _f = 102,
  _g = 103,
  _h = 104,
  _i = 105,
  _j = 106,
  _k = 107,
  _l = 108,
  _m = 109,
  _n = 110,
  _o = 111,
  _p = 112,
  _q = 113,
  _r = 114,
  _s = 115,
  _t = 116,
  _u = 117,
  _v = 118,
  _w = 119,
  _x = 120,
  _y = 121,
  _z = 122,
}

export interface ObjectVar<T> {
  [key: string]: T;
}
