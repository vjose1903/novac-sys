import { fun } from './../services/functions.service';
import * as moment from '../javascript/moment';

export class DateUtils {
  /**
   * objeto para poder obtener número correspondiente a un mes
   * * @example DateUtils.monthNumber.marzo = 3
   */
  static monthNumber = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  /**
   * Objeto para poder obtener el label de un mes pasandole un número
   * @example DateUtils.monthLabel._3_ = marzo
   */
  static monthLabel = {
    _1_: 'enero',
    _2_: 'febrero',
    _3_: 'marzo',
    _4_: 'abril',
    _5_: 'mayo',
    _6_: 'junio',
    _7_: 'julio',
    _8_: 'agosto',
    _9_: 'septiembre',
    _10_: 'octubre',
    _11_: 'noviembre',
    _12_: 'diciembre',
  };

  /**
   * Esta función retorna un arreglo de strings con todos los meses del año
   * @returns Arreglo de los nombres de los meses del año
   * @example DateUtils.getMonthsLabelArray()
   */
  static getMonthsLabelArray() {
    return Object.values(DateUtils.monthLabel);
  }

  /**
   * Esta función retorna el nombre del mes del número que sea pasado
   * @param numberOfMonth (1 - 12). Ejemplo: 3.
   * @returns Nombre del mes
   * @example DateUtils.getMonthLabelByNum(DateUtils.monthNumber.marzo)
   */
  static getMonthLabelByNum(numberOfMonth: number) {
    return DateUtils.monthLabel[`_${numberOfMonth}_`];
  }

  /**
   * Esta función devuelve el primer día del mes correspondiente al año y mes especificados.
   * @param params Objeto que contiene el año y el mes del cual se quiere obtener el primer día.
   *               - month: El número del mes (1 - 12). Ejemplo: 3.
   *               - year: El año. Ejemplo: 2024.
   * @returns El primer día del mes como un objeto Date.
   * @example DateUtils.getFirstDayOfMonth({ month: 3, year: 2024 })
   */
  static getFirstDayOfMonth(params: { month: number; year: number }) {
    return new Date(params.year, params.month - 1, 1);
  }

  /**
   * Retorna el último día del mes correspondiente al año y mes proporcionados.
   * @param params Objeto que contiene el año y el mes del cual se quiere obtener el último día.
   *              - month: El número del mes (1 - 12). Ejemplo: 3.
   *               - year: El año. Ejemplo: 20234.
   * @returns El último día del mes como un objeto Date.
   * @example DateUtils.getLastDayOfMonth({ month: 3, year: 2023 })
   */
  static getLastDayOfMonth(params: { month: number; year: number }) {
    return new Date(params.year, params.month, 0);
  }

  /**
   * Retorna el número correspondiente al mes actual (1-12).
   * @returns El número del mes actual.
   * @example DateUtils.getActualMonth()
   */
  static getActualMonth() {
    return new Date().getMonth() + 1;
  }

  /**
   * Formatea una fecha según las opciones proporcionadas.
   * @param params Objeto con las opciones de formateo de la fecha.
   *               - date: La fecha a formatear (opcional, por defecto es la fecha actual).
   *               - dateFormat: El formato de la fecha (opcional, por defecto es 'DD/MM/YYYY').
   *               - include_hour: Indica si se debe incluir la hora en el formato (opcional, por defecto es false).
   *               - only_hour: Indica si solo se debe incluir la hora en el formato (opcional, por defecto es false).
   *               - hourFormat: El formato de la hora (opcional, por defecto es 'LT').
   *               - separator: El separador entre la fecha y la hora (opcional, por defecto es ' - ').
   * @returns Una cadena de texto que representa la fecha formateada según las opciones proporcionadas.
   * @example DateUtils.format({ date: new Date(), dateFormat: 'DD/MM/YYYY', include_hour: true, only_hour: false, hourFormat: 'LT', separator: ' - ' })
   */
  static format(params?: { date?: any; dateFormat?: string; include_hour?: boolean; only_hour?: boolean; hourFormat?: string; separator?: string }) {
    if (params == undefined) params = {};
    if (fun.hasValue(params.date) && typeof params.date == 'string') params.date = new Date(params.date);
    if (fun.isEmpty(params.date)) params.date = new Date();

    if (fun.isEmpty(params.only_hour)) params.only_hour = params.only_hour ?? false;
    if (fun.isEmpty(params.include_hour)) params.include_hour = (fun.hasValue(params.only_hour) && params.only_hour) || fun.hasValue(params.hourFormat);
    if (params?.separator == undefined) params.separator = ' - ';

    let fecha = `${!params.only_hour ? moment(params.date).format(params.dateFormat ?? 'DD/MM/YYYY') : ''}`;
    if (params.include_hour) fecha += `${fecha.length > 0 ? params.separator : ''}${moment(params.date).format(params.hourFormat ?? 'LT')}`;

    return fecha;
  }
}
