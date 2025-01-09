import { makeFileName } from '../../utils';

export const config = {
  fileName: (datos: string) => makeFileName(datos, 'cuentas_con_pagos'),
};
