import { ToastService } from './toast.service';
import { fun } from './functions.service';

export class CustomLodash extends ToastService {
  constructor() {
    super();
  }
  // __________________________________________________________________________________________________
  // Nombre: pushAt
  // Descripcion : Esta funcion agrega un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pushAt(arr, index, newItem) {
    const copyArr = fun.deepCloning(arr);
    arr.length = 0;
    const newArr = [...copyArr.slice(0, index), newItem, ...copyArr.slice(index)];
    newArr.forEach((item) => arr.push(item));
  }

  // __________________________________________________________________________________________________
  // Nombre: pull
  // Descripcion : Esta funcion remueve un item  de un arreglo
  // _________________________________________________________________________________________________
  static pull(array, item_remove) {
    const index = array.findIndex((item) => fun.isEqual(item, item_remove));
    array.splice(index, 1);
  }

  // __________________________________________________________________________________________________
  // Nombre: pullAt
  // Descripcion : Esta funcion remueve un item en un indice especificado de un arreglo
  // _________________________________________________________________________________________________
  static pullAt(array, index) {
    array.splice(index, 1);
  }

  // __________________________________________________________________________________________________
  // Nombre: objHas
  // Descripcion : Esta funcion retorna un valor booleano si el objeto evaluado contiene todas las propiedades evaluadas
  // _________________________________________________________________________________________________

  static objHas(obj, props) {
    let result = true;
    const props_split = props.split('.');

    for (let index = 0; index < props_split.length; index++) {
      const current_prop = props_split[index];
      const current_object = fun.getCurrentObjLevel(obj, props_split, index);

      if (fun.hasValue(current_object)) result = current_object.hasOwnProperty(current_prop);
      else result = false;

      if (result == false) break;
    }

    return result;
  }

  // __________________________________________________________________________________________________
  // Nombre: getProperty
  // Descripcion : Esta funcion retorna el valor de una propiedad de un objeto
  // _________________________________________________________________________________________________
  static getProperty(obj, prop) {
    const props_split = prop.split('.');
    return props_split.reduce((objeto, property) => (typeof objeto == 'undefined' || objeto === null ? objeto : objeto[property]), obj);
  }

  // __________________________________________________________________________________________________
  // Nombre: maxBy
  // Descripcion : esta funcion retorna el elemento mas alto dependiendo de una propiedad
  // _________________________________________________________________________________________________
  static maxBy(collection, iteratee) {
    if (collection == null || collection.length === 0) return undefined;

    let maxElement = collection[0];
    let maxValue = typeof iteratee === 'function' ? iteratee(maxElement) : maxElement[iteratee];

    for (let i = 1; i < collection.length; i++) {
      const element = collection[i];
      const value = typeof iteratee === 'function' ? iteratee(element) : element[iteratee];

      if (value > maxValue) {
        maxValue = value;
        maxElement = element;
      }
    }

    return maxElement;
  }

  // __________________________________________________________________________________________________
  // Nombre: setProperty
  // Descripcion : Esta funcion setea una propiedad a un objeto
  // _________________________________________________________________________________________________
  static setProperty(obj, prop, valor) {
    const props_split = prop.split('.');

    fun.createNestedObject(obj, [...props_split], valor);
  }

  // __________________________________________________________________________________________________
  // Nombre: pick
  // Descripcion : Esta funcion retorna un nuevo objeto con las propiedades requeridas
  // _________________________________________________________________________________________________
  static pick(obj, props): any {
    const result = {};

    for (let index = 0; index < props.length; index++) {
      const prop = props[index];
      const props_split = prop.split('.');

      fun.createNestedObject(result, [...props_split], fun.getProperty(obj, prop));
    }
    return result;
  }

  // __________________________________________________________________________________________________
  // Nombre: omit
  // Descripcion : Esta funcion retorna un nuevo objeto con las propiedades omitidas
  // _________________________________________________________________________________________________
  static omit(obj, props) {
    for (let index = 0; index < props.length; index++) {
      const prop = props[index];

      if (fun.hasValue(fun.getProperty(obj, prop))) {
        const props_split = prop.split('.');
        let current_object = obj;

        for (let innerIndex = 0; innerIndex < props_split.length; innerIndex++) {
          const currentProp = props_split[innerIndex];

          current_object = fun.getCurrentObjLevel(obj, props_split, innerIndex);

          if (innerIndex == props_split.length - 1) delete current_object[currentProp];
        }
      }
    }

    return obj;
  }

  static getCurrentObjLevel(mainObj, props_split, actualIndex, deepLevel = 0) {
    let obj_en_turno = mainObj;

    if (fun.hasValue(mainObj) && actualIndex > 0 && deepLevel < actualIndex) {
      const nextLevel = mainObj[props_split[deepLevel]];
      deepLevel += 1;
      obj_en_turno = fun.getCurrentObjLevel(nextLevel, props_split, actualIndex, deepLevel);
    }

    return obj_en_turno;
  }

  toString = Object.prototype.toString;

  static createMap() {
    return Object.create(null);
  }
  static isWindow(obj) {
    return obj && obj.window === obj;
  }
  static isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
  }
  static isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  }
  static simpleCompare(a, b) {
    return a === b || (a !== a && b !== b);
  }
  static isDate(value) {
    return toString.call(value) === '[object Date]';
  }
  static isArray(arr) {
    return Array.isArray(arr) || arr instanceof Array;
  }

  static isEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return false;
    if (obj1 !== obj1 && obj2 !== obj2) return true; // NaN === NaN

    let length, key, keySet;

    if (typeof obj1 === typeof obj2 && typeof obj1 === 'object') {
      if (fun.isArray(obj1)) {
        if (!fun.isArray(obj2)) return false;

        if ((length = obj1.length) === obj2.length) {
          for (key = 0; key < length; key++) {
            if (!fun.isEqual(obj1[key], obj2[key])) return false;
          }

          return true;
        }
      } else if (fun.isDate(obj1)) {
        if (!fun.isDate(obj2)) return false;
        return fun.simpleCompare(obj1.getTime(), obj2.getTime());
      } else if (fun.isRegExp(obj1)) {
        if (!fun.isRegExp(obj2)) return false;
        return obj1.toString() === obj2.toString();
      } else {
        if (fun.isScope(obj1) || fun.isScope(obj2) || fun.isWindow(obj1) || fun.isWindow(obj2) || fun.isArray(obj2) || fun.isDate(obj2) || fun.isRegExp(obj2)) return false;
        keySet = fun.createMap();
        for (key in obj1) {
          if (key.charAt(0) === '$' || fun.isFunction(obj1[key])) continue;
          if (!fun.isEqual(obj1[key], obj2[key])) return false;
          keySet[key] = true;
        }
        for (key in obj2) {
          if (!(key in keySet) && key.charAt(0) !== '$' && fun.hasValue(obj2[key]) && !fun.isFunction(obj2[key])) return false;
        }
        return true;
      }
    }
    return false;
  }
}
