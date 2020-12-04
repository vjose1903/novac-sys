"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fun_ = require("./utils/funciones");
var files_1 = require("./utils/files");
var environment_js_1 = require("../src/environments/environment.js");
// ==========================================================================================================================================================
// UNIR FACTURA VENTA
// ==========================================================================================================================================================
function getPageMargin(data) {
    var margins = [];
    if (data.condicion === 'Contado') {
        margins = [0, 161, 0, 30];
    }
    else {
        margins = [0, 168, 0, 30];
    }
    console.log('margen ==> ', margins);
    return margins;
}
function makeFacturaVenta(data) {
    var dd = {
        pageSize: { width: 990, height: 398 },
        pageMargins: getPageMargin(data),
        header: cabeceraFacturaVenta(data),
        content: contenidoFacturaVenta(data),
        footer: function (currentPage, pageCount) {
            return [
                {
                    text: 'pag: ' + currentPage.toString() + ' de ' + pageCount,
                    alignment: 'right',
                    margin: [0, 0, 30, 0],
                },
                data.FACTURA_DE === 'venta'
                    ? data.condicion === 'Contado'
                        ? { text: '' }
                        : {
                            text: 'Después de la fecha de vencimiento de la factura, se generará un 2% de recargo',
                            alignment: 'center',
                            margin: [0, -10, 0, 0],
                        }
                    : { text: '' },
            ];
        },
        images: {
            logo: files_1.logoADM,
        },
        styles: files_1.styles_,
    };
    var obj = {
        doc: dd,
        file: 'factura.pdf',
        type: 'file',
    };
    return obj;
}
exports.makeFacturaVenta = makeFacturaVenta;
// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraFacturaVenta(data) {
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
                [
                    data.FACTURA_DE === 'nota'
                        ? { text: '' }
                        : {
                            text: 'FACTURA A ' + data.condicion.toUpperCase(),
                            alignment: 'right',
                            bold: true,
                            style: 'letra14',
                            margin: [0, 20, 30],
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
            margin: [15, 15, 0, 0],
            columns: [
                [
                    {
                        text: [
                            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Cliente : ', style: 'letra12' } : { text: 'Suplidor : ', style: 'letra12' },
                            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.nombre, style: 'letra12' } : { text: data.suplidor.nombre, style: 'letra12' },
                        ],
                        margin: [0, 0, 0, 0],
                    },
                    {
                        text: [
                            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: 'Rnc cliente : ', style: 'letra12' } : { text: 'Rnc suplidor : ', style: 'letra12' },
                            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.rnc, style: 'letra12' } : { text: data.suplidor.rnc, style: 'letra12' },
                        ],
                        margin: [0, 5, 0, 0],
                    },
                    {
                        text: [
                            { text: 'Dirección : ', style: 'letra12' },
                            data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? { text: data.cliente.direccion, style: 'letra12' } : { text: data.suplidor.direccion, style: 'letra12' },
                        ],
                        margin: [0, 5, 0, 0],
                    },
                ],
                [
                    {
                        text: [{ text: data.tipo_factura, style: 'letra14' }],
                        margin: [0, 15, 0, 0],
                        alignment: 'center',
                    },
                    data.FACTURA_DE === 'compra'
                        ? {
                            text: [{ text: '- - - COMPRA - - -', style: 'letra11' }],
                            margin: [0, 1, 0, 0],
                            alignment: 'center',
                        }
                        : { text: '' },
                    data.FACTURA_DE === 'nota'
                        ? {
                            text: [
                                { text: 'Aplicada a: ', style: 'letra11' },
                                { text: data.aplicada_a, style: 'letra11' },
                            ],
                            margin: [0, 1, 0, 0],
                            alignment: 'center',
                        }
                        : { text: '' },
                ],
                [
                    {
                        margin: data.condicion === 'Contado' ? [60, 0, 0, 0] : [60, -5, 0, 0],
                        stack: [
                            {
                                text: [
                                    { text: 'Fecha : ', style: 'letra11' },
                                    { text: fun_.my_dateFormater(data.fecha_equivalente), style: 'letra11' },
                                    { text: ' - ' + fun_.my_houreFormater(data.fecha_equivalente), style: 'letra11' },
                                ],
                                margin: [85, -10, 0, 0],
                            },
                            (data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' || data.FACTURA_DE === 'compra') && data.condicion === 'Contado'
                                ? { text: '' }
                                : {
                                    text: [
                                        { text: 'Fecha vencimiento : ', style: 'letra11' },
                                        { text: fun_.my_dateFormater(data.fecha_vencimiento), style: 'letra11' },
                                    ],
                                    margin: [85, 3, 0, 0],
                                },
                            {
                                text: [
                                    { text: 'NCF : ', style: 'letra11' },
                                    { text: data.numero_comprobante, style: 'letra11' },
                                ],
                                margin: [85, 3, 0, 0],
                            },
                            {
                                text: [
                                    { text: 'Doc No : ', style: 'letra11' },
                                    { text: fun_.my_padStart(data.numero_factura, 8, '0'), style: 'letra11' },
                                ],
                                margin: [85, 3, 0, 0],
                            },
                            {
                                text: [
                                    { text: 'Valida hasta : ', style: 'letra11' },
                                    data.tipo_factura_id === 3
                                        ? { text: 'No aplica.', style: 'letra11' }
                                        : data.FACTURA_DE === 'compra'
                                            ? { text: ' ' }
                                            : { text: fun_.my_dateFormater(data.fecha_valida), style: 'letra11' },
                                ],
                                margin: [85, 3, 0, 0],
                            },
                        ],
                    },
                ],
            ],
        },
        // =============================================================
        {
            canvas: [
                {
                    type: 'rect',
                    x: 10,
                    y: 3,
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
                widths: [30, 245, '*', '*', '*', '*', '*'],
                body: [
                    [
                        { text: ' #', bold: true, alignment: 'center', margin: [4, 0, 0, 0] },
                        { text: 'Articulo', bold: true, margin: [-5, 0, 0, 0] },
                        { text: 'Cantidad', bold: true, alignment: 'right', margin: [0, 0, 5, 0] },
                        { text: 'Unidad', bold: true, alignment: 'center', margin: [0, 0, 15, 0] },
                        data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota'
                            ? { text: 'Precio', bold: true, alignment: 'right', margin: [0, 0, 17, 0] }
                            : { text: 'Costo', bold: true, alignment: 'right', margin: [0, 0, 18, 0] },
                        { text: 'Itbis', bold: true, alignment: 'right', margin: [0, 0, 17, 0] },
                        { text: 'Total', bold: true, alignment: 'right', margin: [0, 0, 18, 0] },
                    ],
                    [1, 'Sample value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6'],
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
function calcularPrecio(cant, precio, tipo) {
    var res = cant * precio;
    return fun_.redondearAdos(res);
}
function contenidoFacturaVenta(data) {
    var tempBody = [];
    data.detalle_facturas.forEach(function (detalle, i) {
        var row = [];
        var br_ = i !== 0 && i % 5 === 0;
        row.push({ text: i + 1, alignment: 'center', pageBreak: br_ ? 'before' : 'none' }, { text: detalle.descripcion, pageBreak: br_ ? 'before' : 'none' }, { text: fun_.numFormatTwoDecimals(detalle.cantidad), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' }, { text: detalle.unidad, alignment: 'center', pageBreak: br_ ? 'before' : 'none' }, {
            text: fun_.numFormatTwoDecimals(data.FACTURA_DE === 'venta' || data.FACTURA_DE === 'nota' ? detalle.precio : detalle.costo),
            alignment: 'right',
            margin: [0, 0, 14, 0],
            pageBreak: br_ ? 'before' : 'none',
        }, { text: fun_.numFormatTwoDecimals(detalle.itbis), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' }, { text: fun_.numFormatTwoDecimals(detalle.total), alignment: 'right', margin: [0, 0, 15, 0], pageBreak: br_ ? 'before' : 'none' });
        tempBody.push(row);
    });
    var content = [
        {
            style: 'tableExample',
            table: {
                widths: [30, 245, '*', '*', '*', '*', '*'],
                body: tempBody,
            },
            margin: data.condicion === 'Contado' ? [10, -2, 10, 0] : [10, -2, 10, 0],
            layout: {
                hLineWidth: function (i, node) {
                    return i % 5 === 0 && node.table.body.length !== 5 ? 0 : i === node.table.body.length ? 2 : 1;
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
                { text: data.usuario, style: 'letra11' },
                data.vendedor ? { text: '    Vendedor :  ', style: 'letra11', bold: true } : { text: '' },
                data.vendedor ? { text: data.vendedor, style: 'letra11' } : { text: '' },
            ],
            margin: [20, 5, 0, 0],
        },
        // -----------------------
        {
            stack: [
                {
                    columns: [
                        [
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
                                                    margin: [65, 5, 0, 0],
                                                },
                                            ],
                                        ],
                                    },
                                ],
                                margin: [0, -40, 0, 0],
                            },
                        ],
                        [
                            {
                                margin: [0, -12, 0, 0],
                                table: {
                                    widths: ['*', 'auto'],
                                    body: [
                                        [
                                            { text: 'Bruto RD$: ', style: 'letra11_5', bold: true, alignment: 'right' },
                                            { text: fun_.numFormatTwoDecimals(data.Bruto), style: 'letra11_5', alignment: 'right', margin: [0, 0, data.detalle_facturas.length <= 5 ? 29 : 49, 0] },
                                        ],
                                        [
                                            { text: 'Itbis RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                                            { text: fun_.numFormatTwoDecimals(data.itbis), style: 'letra11_5', alignment: 'right', margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0] },
                                        ],
                                        [
                                            { text: 'Descuento RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                                            { text: fun_.numFormatTwoDecimals(data.descuento), style: 'letra11_5', alignment: 'right', margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0] },
                                        ],
                                        [
                                            { text: 'TOTAL RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                                            { text: fun_.numFormatTwoDecimals(data.total_factura), style: 'letra11_5', alignment: 'right', margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0] },
                                        ],
                                        data.FACTURA_DE === 'compra' || data.FACTURA_DE === 'nota'
                                            ? [{ text: '' }, { text: '' }]
                                            : [
                                                { text: 'Devuelta RD$: ', style: 'letra11_5', bold: true, alignment: 'right', margin: [0, -2, 0, 0] },
                                                { text: fun_.numFormatTwoDecimals(data.devuelta), style: 'letra11_5', alignment: 'right', margin: [0, -2, data.detalle_facturas.length <= 5 ? 29 : 49, 0] },
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
