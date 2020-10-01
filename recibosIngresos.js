"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var moment = require("moment");
var files_1 = require("./files");
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function makeRecibo(data) {
    var dd = {
        pageSize: { width: 816, height: 528 },
        pageMargins: [10, 180, 10, 30],
        header: cabeceraRecibo(data),
        content: contenidoRecibo(data),
        footer: function (currentPage, pageCount) {
            return [
                {
                    text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
                    alignment: 'right',
                    margin: [0, 0, 30, 0],
                },
            ];
        },
        images: {
            logo: files_1.logoADM,
        },
        styles: {
            letra10: {
                fontSize: 10,
            },
            letra11: {
                fontSize: 11,
            },
            letra12: {
                fontSize: 12,
            },
            letra14: {
                fontSize: 14,
            },
            letra17: {
                fontSize: 17,
            },
        },
    };
    var obj = {
        doc: dd,
        file: 'reciboI.pdf',
    };
    return obj;
}
exports.makeRecibo = makeRecibo;
// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraRecibo(data) {
    var rncCliente = data.cliente.documentos_de_identidad.filter(function (doc) { return doc.principal === true; })[0].documento;
    var header = [
        {
            columns: [[{ image: 'logo', width: 72, opacity: 0.85, margin: [90, 12, 0, 0] }]],
        },
        {
            margin: [0, -62, 0, 0],
            stack: [
                {
                    text: 'ADM Agroindustrial S.R.L',
                    alignment: 'center',
                    bold: true,
                    fontSize: 17,
                },
                {
                    text: 'Autopista Duarte Km0 El Higuero, La Vega',
                    alignment: 'center',
                },
                {
                    text: [
                        { text: 'Telefono: ', fontSize: 9, bold: true },
                        { text: '809-572-0060 ', fontSize: 9 },
                        { text: ' RNC: ', fontSize: 9, bold: true },
                        { text: '131-99603-5', fontSize: 9 },
                    ],
                    alignment: 'center',
                },
            ],
        },
        {
            margin: [15, 15, 0, 0],
            columns: [
                [
                    {
                        text: [{ text: 'Cliente: ', fontSize: 12, bold: true }, { text: _.capitalize(data.cliente.nombre) + ' ' + _.capitalize(data.cliente.apellido) }],
                        margin: [0, 0, 0, 0],
                    },
                    {
                        text: [{ text: 'Rnc cliente: ', fontSize: 12, bold: true }, { text: rncCliente }],
                        margin: [0, 5, 0, 0],
                    },
                    {
                        text: [{ text: 'Dirección: ', fontSize: 12, bold: true }, { text: data.cliente.direccion }],
                        margin: [0, 5, 0, 0],
                    },
                ],
                [
                    {
                        text: [{ text: 'Recibo de ingresos', fontSize: 14, bold: true }],
                        margin: [0, 15, 0, 0],
                        alignment: 'center',
                    },
                ],
                [
                    {
                        text: [
                            { text: 'Fecha: ', fontSize: 12, bold: true },
                            { text: fecha(data.created_at), fontSize: 12 },
                            { text: ' - ' + hora(data.created_at), fontSize: 12 },
                        ],
                        margin: [60, 0, 0, 0],
                    },
                    {
                        text: [
                            { text: 'Doc No: ', fontSize: 12, bold: true },
                            { text: _.padStart(data.numero_recibo, 8, '0'), fontSize: 12 },
                        ],
                        margin: [60, 3, 0, 0],
                    },
                ],
            ],
        },
        { canvas: [{ type: 'rect', x: 10, y: 5, w: 795, h: 2, color: '#000000' }] },
        {
            margin: [10, 0, 10, 0],
            table: {
                headerRows: 1,
                widths: [24, '*', '*'],
                body: [
                    [
                        {
                            text: '#',
                            style: 'tableHeader',
                            bold: true,
                            margin: [4, 0, 0, 0],
                        },
                        {
                            text: 'Descripción',
                            style: 'tableHeader',
                            bold: true,
                            margin: [-3, 0, 0, 0],
                        },
                        {
                            text: 'Cantidad',
                            style: 'tableHeader',
                            bold: true,
                            alignment: 'right',
                            margin: [0, 0, 20, 0],
                        },
                    ],
                    [1, 'Sample value 1', 'value 2'],
                ],
            },
            layout: 'headerLineOnly',
        },
    ];
    return header;
}
// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function contenidoRecibo(data) {
    var tempBody = [];
    data.detalle_recibos.forEach(function (detalle, i) {
        var row = [];
        var br_ = i !== 0 && i % 11 === 0;
        row.push({ text: i + 1, pageBreak: br_ ? 'before' : 'none' }, { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none' }, { text: numFormatTwoDecimals(detalle.deposito), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 20, 0] });
        tempBody.push(row);
    });
    var content = [
        {
            margin: [0, -9, 0, 0],
            table: {
                widths: [24, '*', '*'],
                body: tempBody,
            },
            layout: {
                hLineWidth: function (i, node) {
                    return i % 11 === 0 && node.table.body.length !== 11 ? 0 : i === node.table.body.length ? 2 : 1;
                },
                vLineWidth: function (i, node) {
                    return 0;
                },
                hLineColor: function (i, node) {
                    return i === node.table.body.length ? 'black' : 'gray';
                },
                vLineColor: function (i, node) {
                    return 'black';
                },
            },
        },
        {
            text: [
                { text: 'Realizada Por :  ', style: 'letra11', bold: true },
                { text: _.capitalize(data.user.nombre) + ' ' + _.capitalize(data.user.apellido), style: 'letra11' },
            ],
            margin: [5, 5, 0, 0],
        },
        {
            stack: [
                {
                    margin: [10, 30, 0, 0],
                    columns: [
                        [
                            {
                                stack: [
                                    {
                                        margin: [0, 0, 0, 0],
                                        canvas: [
                                            { type: 'rect', x: 0, y: 0, w: 140, h: 1, color: '#000000' },
                                            { type: 'rect', x: 215, y: 0, w: 140, h: 1, color: '#000000' },
                                        ],
                                    },
                                    {
                                        columns: [
                                            [
                                                {
                                                    text: [{ text: 'Recibido Por', fontSize: 12, bold: true }],
                                                    margin: [35, 5, 0, 0],
                                                },
                                            ],
                                            [
                                                {
                                                    text: [{ text: 'Entregado Por', fontSize: 12, bold: true }],
                                                    margin: [50, 5, 0, 0],
                                                },
                                            ],
                                        ],
                                    },
                                ],
                            },
                        ],
                        [
                            {
                                table: {
                                    widths: ['*'],
                                    body: [
                                        [
                                            {
                                                margin: [0, 0, 25, 0],
                                                alignment: 'right',
                                                text: [
                                                    {
                                                        text: 'TOTAL RD$:         ',
                                                        bold: true,
                                                    },
                                                    { text: numFormatTwoDecimals(data.total), fontSize: 12 },
                                                ],
                                            },
                                        ],
                                    ],
                                },
                                layout: 'noBorders',
                            },
                        ],
                    ],
                },
            ],
            unbreakable: true,
        },
    ];
    return content;
}
// ==========================================================================================================================================================
function redondearAdos(num) {
    var string = num + '';
    var splitStr = _.split(string, '.');
    var enteros = splitStr[0];
    var splitEnteros = _.split(enteros, ',');
    enteros = _.join(splitEnteros, '');
    var tempdecimales = splitStr[1];
    if (splitStr.length === 1) {
        tempdecimales = '00';
    }
    var decimales = tempdecimales.substring(0, 2);
    var Arreglo = [enteros, decimales];
    var numStr = _.join(Arreglo, '.');
    return parseFloat(numStr).toFixed(2);
}
function formatearNumero(nStr) {
    if (nStr !== undefined) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }
}
// =========================================================================================================
function numFormatTwoDecimals(num) {
    return formatearNumero(redondearAdos(num));
}
function fecha(a) {
    moment.locale('es');
    var fechaFormato = moment(a).format('DD/MM/YYYY');
    return fechaFormato;
}
function hora(a) {
    moment.locale('es');
    var horaFormato = moment(a).format('hh:mm a');
    return horaFormato;
}
//# sourceMappingURL=recibosIngresos.js.map