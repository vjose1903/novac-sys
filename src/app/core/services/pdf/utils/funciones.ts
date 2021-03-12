// =========================================================================================================
export function my_capitalize(str) {
  const ultimoCaracte = str.length + 1;
  return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracte).toLowerCase();
}
// =========================================================================================================

export function my_padStart(str, cant, relleno) {
  let hasta = parseInt(cant) - str.toString().length;
  hasta = hasta === -1 ? 0 : hasta;
  let newStr = '';
  for (let i = 0; i < hasta; i++) {
    newStr += '0';
  }
  newStr += str;

  return newStr;
}
// =========================================================================================================

export function my_stringSplit(str, target) {
  return str.split(target);
}

// =========================================================================================================
export function my_stringJoin(str, target) {
  return str.join(target);
}

// =========================================================================================================
export function my_dateFormater(str) {
  let dateObj = new Date(str);
  let month = String(dateObj.getMonth() + 1).padStart(2, '0');
  let day = String(dateObj.getDate()).padStart(2, '0');
  let year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

// =========================================================================================================
export function my_houreFormater(str) {
  const dateObj = new Date(str);

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;

  const res = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
  return res;
}

// =========================================================================================================

export function redondearAdos(num) {
  const string = num + '';
  const splitStr = my_stringSplit(string, '.');

  let enteros = splitStr[0];

  const splitEnteros = my_stringSplit(enteros, ',');

  enteros = my_stringJoin(splitEnteros, '');

  let tempdecimales = splitStr[1];
  if (splitStr.length === 1) {
    tempdecimales = '00';
  }

  const decimales = tempdecimales.substring(0, 2);
  const Arreglo = [enteros, decimales];
  const numStr = my_stringJoin(Arreglo, '.');

  return parseFloat(numStr).toFixed(2);
}
// =========================================================================================================

export function formatearNumero(nStr) {
  if (nStr !== undefined) {
    nStr += '';
    const x = my_stringSplit(nStr, '.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }
}
// =========================================================================================================
export function numFormatTwoDecimals(num, tachado = false) {
  if (tachado) {
    return typeof num === 'string' ? num : num < 1 ? '-' : formatearNumero(redondearAdos(num));
  } else {
    return typeof num === 'string' ? num : formatearNumero(redondearAdos(num));
  }
}
