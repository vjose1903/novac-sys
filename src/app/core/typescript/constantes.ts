export const pattern = {
  phone: ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
  cedula: [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/],
  rnc: [/[0-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/],
};

export enum teclasCode {
  arriba = 38,
  abajo = 40,
  enter = 13,
  control = 17,
  shift = 16,
  alt = 18,
  p = 80,
  g = 71,
}
