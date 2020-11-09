"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fun_ = require("./utils/funciones");
var files_1 = require("./utils/files");
var environment_js_1 = require("../src/environments/environment.js");
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function makeConduce(data) {
    var dd = {
        pageSize: { width: 990, height: 398 },
        pageMargins: [0, 163, 0, 30],
        header: cabeceraConduce(data),
        content: contenidoConduce(data),
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
        styles: files_1.styles_,
    };
    var obj = {
        doc: dd,
        file: 'conduce.pdf',
        type: 'file',
    };
    return obj;
}
exports.makeConduce = makeConduce;
// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraConduce(data) {
    var rncCliente = data.cliente.documentos_de_identidad.filter(function (doc) { return doc.principal === true; })[0].documento;
    var header = [
        {
            columns: [
                [
                    {
                        image: 'logo',
                        width: 72,
                        height: 45,
                        margin: [90, 12, 0, 0],
                    },
                ],
            ],
        },
        {
            margin: [0, -40, 0, 0],
            stack: [
                {
                    text: 'ADM Agroindustrial S.R.L',
                    alignment: 'center',
                    bold: true,
                    style: 'letra17',
                },
                {
                    text: 'Autopista Duarte Km0 El Higuero, La Vega',
                    alignment: 'center',
                },
                {
                    text: [
                        { text: 'Telefono: ', style: 'letra11  ' },
                        { text: environment_js_1.AppConfig.num_telefono + ' ', style: 'letra11' },
                        { text: ' RNC: ', bold: true, style: 'letra11' },
                        { text: environment_js_1.AppConfig.rnc, style: 'letra11' },
                    ],
                    alignment: 'center',
                },
            ],
        },
        {
            margin: [15, 20, 0, 0],
            columns: [
                [
                    {
                        text: [
                            { text: 'Cliente: ', style: 'letra12' },
                            { text: fun_.my_capitalize(data.cliente.nombre) + ' ' + fun_.my_capitalize(data.cliente.apellido), style: 'letra12' },
                        ],
                        margin: [0, 0, 0, 0],
                    },
                    {
                        text: [
                            { text: 'Rnc cliente: ', style: 'letra12' },
                            { text: rncCliente, style: 'letra12' },
                        ],
                        margin: [0, 3, 0, 0],
                    },
                    {
                        text: [
                            { text: 'Dirección: ', style: 'letra12' },
                            { text: data.cliente.direccion, style: 'letra12' },
                        ],
                        margin: [0, 3, 0, 0],
                    },
                ],
                [
                    {
                        text: [{ text: 'Conduce de mercancia', style: 'letra14', bold: true }],
                        margin: [0, 15, 0, 0],
                        alignment: 'center',
                    },
                ],
                [
                    {
                        text: [
                            { text: 'Fecha: ', style: 'letra12' },
                            { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra12' },
                            { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra12' },
                        ],
                        margin: [150, 0, 0, 0],
                    },
                    {
                        text: [
                            { text: 'Doc No: ', style: 'letra12' },
                            { text: fun_.my_padStart(data.numero_conduce, 8, '0'), style: 'letra12' },
                        ],
                        margin: [150, 3, 0, 0],
                    },
                ],
            ],
        },
        {
            canvas: [
                {
                    type: 'rect',
                    x: 10,
                    y: 5,
                    w: 970,
                    h: 2,
                    color: '#000000',
                },
            ],
        },
        {
            style: 'tableExample',
            table: {
                headerRows: 1,
                widths: [23, 60, 120, '*'],
                body: [
                    [
                        {
                            text: '#',
                            style: 'tableHeader',
                            alignment: 'center',
                            bold: true,
                            margin: [4, 0, 0, 0],
                        },
                        {
                            text: 'Cantidad',
                            style: 'tableHeader',
                            bold: true,
                            margin: [0, 0, 0, 0],
                            alignment: 'right',
                        },
                        {
                            text: 'Unidad',
                            style: 'tableHeader',
                            bold: true,
                            alignment: 'left',
                            margin: [0, 0, 60, 0],
                        },
                        {
                            text: 'Descripción',
                            style: 'tableHeader',
                            bold: true,
                            alignment: 'left',
                            margin: [-20, 0, 0, 0],
                        },
                    ],
                    [1, 'Sample value 1', 'value 2', 'value 2'],
                ],
            },
            margin: [10, 0, 10, 0],
            layout: 'headerLineOnly',
        },
    ];
    return header;
}
// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function contenidoConduce(data) {
    var tempBody = [];
    data.detalle_conduces.forEach(function (detalle, i) {
        var row = [];
        var br_ = i !== 0 && i % 6 === 0;
        row.push({ text: i + 1, pageBreak: br_ ? 'before' : 'none', alignment: 'center' }, { text: fun_.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', pageBreak: br_ ? 'before' : 'none', margin: [0, 0, 10, 0] }, { text: detalle.unidad, pageBreak: br_ ? 'before' : 'none', alignment: 'left', margin: [50, 0, 0, 0] }, { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none', alignment: 'left' });
        tempBody.push(row);
    });
    var content = [
        {
            margin: [10, -2, 10, 0],
            table: {
                widths: [23, 60, 120, '*'],
                body: tempBody,
            },
            layout: {
                hLineWidth: function (i, node) {
                    return i % 6 === 0 && node.table.body.length !== 6 ? 0 : i === node.table.body.length ? 2 : 1;
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
                { text: 'Realizado Por :  ', style: 'letra11', bold: true },
                { text: fun_.my_capitalize(data.user.nombre) + ' ' + fun_.my_capitalize(data.user.apellido), style: 'letra11' },
            ],
            margin: [20, 5, 0, 0],
        },
        {
            stack: [
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: 10,
                            y: 0,
                            w: 160,
                            h: 1,
                            color: '#000000',
                        },
                        {
                            type: 'rect',
                            x: 250,
                            y: 0,
                            w: 160,
                            h: 1,
                            color: '#000000',
                        },
                    ],
                    margin: [0, 80, 0, 0],
                },
                {
                    columns: [
                        [
                            {
                                text: [{ text: 'Revisada Por', style: 'letra12', bold: true }],
                                margin: [50, 5, 0, 0],
                            },
                        ],
                        [
                            {
                                text: [{ text: 'Cliente', style: 'letra12', bold: true }],
                                margin: [-195, 5, 0, 0],
                            },
                        ],
                    ],
                },
            ],
            margin: [0, -40, 0, 0],
            unbreakable: true,
        },
    ];
    return content;
}
