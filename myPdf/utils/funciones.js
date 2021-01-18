"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =========================================================================================================
function my_capitalize(str) {
    var ultimoCaracte = str.length + 1;
    return str.substr(0, 1).toUpperCase() + str.substr(1, ultimoCaracte).toLowerCase();
}
exports.my_capitalize = my_capitalize;
// =========================================================================================================
function my_padStart(str, cant, relleno) {
    var hasta = parseInt(cant) - str.toString().length;
    hasta = hasta === -1 ? 0 : hasta;
    var newStr = '';
    for (var i = 0; i < hasta; i++) {
        newStr += '0';
    }
    newStr += str;
    return newStr;
}
exports.my_padStart = my_padStart;
// =========================================================================================================
function my_stringSplit(str, target) {
    return str.split(target);
}
exports.my_stringSplit = my_stringSplit;
// =========================================================================================================
function my_stringJoin(str, target) {
    return str.join(target);
}
exports.my_stringJoin = my_stringJoin;
// =========================================================================================================
function my_dateFormater(str) {
    var dateObj = new Date(str);
    var month = String(dateObj.getMonth() + 1).padStart(2, '0');
    var day = String(dateObj.getDate()).padStart(2, '0');
    var year = dateObj.getFullYear();
    return day + "/" + month + "/" + year;
}
exports.my_dateFormater = my_dateFormater;
// =========================================================================================================
function my_houreFormater(str) {
    var dateObj = new Date(str);
    var hours = dateObj.getHours();
    var minutes = dateObj.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var res = "" + (hours < 10 ? '0' : '') + hours + ":" + (minutes < 10 ? '0' : '') + minutes + " " + ampm;
    return res;
}
exports.my_houreFormater = my_houreFormater;
// =========================================================================================================
function redondearAdos(num) {
    var string = num + '';
    var splitStr = my_stringSplit(string, '.');
    var enteros = splitStr[0];
    var splitEnteros = my_stringSplit(enteros, ',');
    enteros = my_stringJoin(splitEnteros, '');
    var tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
        tempdecimales = '00';
    }
    var decimales = tempdecimales.substring(0, 2);
    var Arreglo = [enteros, decimales];
    var numStr = my_stringJoin(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
}
exports.redondearAdos = redondearAdos;
// =========================================================================================================
function formatearNumero(nStr) {
    if (nStr !== undefined) {
        nStr += '';
        var x = my_stringSplit(nStr, '.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }
}
exports.formatearNumero = formatearNumero;
// =========================================================================================================
function numFormatTwoDecimals(num) {
    return formatearNumero(redondearAdos(num));
}
exports.numFormatTwoDecimals = numFormatTwoDecimals;
