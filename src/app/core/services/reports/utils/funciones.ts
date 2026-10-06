import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

// =========================================================================================================
export function my_barcode(code) {
  var canvas = document.createElement('canvas');
  JsBarcode(canvas, code, { displayValue: false });

  return canvas.toDataURL('image/png');
}

export function my_qrcode(code, size = 200) {
  if (isEmpty(code)) return '';

  // Crear un elemento canvas
  const canvas = document.createElement('canvas');

  // Establecer dimensiones exactas
  canvas.width = size;
  canvas.height = size;

  // Opciones de configuración para el QR
  const options = {
    width: size,
    margin: 1, // Margen mínimo
    color: {
      dark: '#000000', // Color de los módulos QR
      light: '#FFFFFF', // Color de fondo
    },
    errorCorrectionLevel: 'M', // L, M, Q, H - nivel de corrección de errores (M es un buen balance)
  };

  // Generar QR de forma síncrona
  QRCode.toCanvas(canvas, code, options);

  // Devolver como imagen en formato base64, igual que my_barcode
  return canvas.toDataURL('image/png');
}

export const pageBreak = { text: '', pageBreak: 'before' };
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
export function isEmpty(value) {
  return (
    // es null o indefinido
    value === null ||
    value === undefined ||
    // es una fecha invalida
    (value instanceof Date && isNaN(value.getTime())) ||
    // si tiene longitud 0
    (value.hasOwnProperty('length') && value.length == 0) ||
    // si es un string vacio o con lleno de espacios
    (typeof value == 'string' && value.trim().length == 0) ||
    // si es un objeto y no tiene propiedades
    (value.constructor == Object && Object.keys(value).length == 0)
  );
}
// =========================================================================================================

export function roundNumber(number, cant = 2) {
  if (isEmpty(number)) return number;

  if (typeof number == 'string') number = parseFloat(desformatearStNumber(number));
  if (isNaN(number)) return number;

  const numerRounded = number.toFixed(cant);
  // Formateamos el número con comas para separar millares
  const partes = numerRounded.split('.');
  const enteros = partes[0];
  const decimales = partes[1];
  const numeroFormateado = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + decimales;

  return numeroFormateado;
}
// =========================================================================================================
export function desformatearStNumber(sTnum: any) {
  const number = typeof sTnum == 'string' ? parseFloat(sTnum.replaceAll(',', '')) : sTnum;
  return number;
}
// =========================================================================================================
export function roundNumberToDecimal(num, tachado = false) {
  const numberFormated = tachado && num < 1 ? '-' : roundNumber(num);
  return numberFormated;
}
