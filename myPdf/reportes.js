"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fun_ = require("./utils/funciones");
var files_1 = require("./utils/files");
var environment_js_1 = require("../src/environments/environment.js");
// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================
function makeReporte(data) {
    var dd = {
        // pageSize: { width: 990, height: 398 },
        pageMargins: [0, data.mostrar_sub_titulo ? 118.5 : 111.5, 0, 30],
        header: cabeceraReporte(data),
        content: contenidoReporte(data),
        footer: function (currentPage, pageCount) {
            return [
                {
                    text: ' ',
                    alignment: 'right',
                    style: 'letra10',
                    margin: [0, 0, 20, 0],
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
        file: 'reporte.pdf',
        type: 'base64',
    };
    return obj;
}
exports.makeReporte = makeReporte;
// ==========================================================================================================================================================
// CABECERA
// ==========================================================================================================================================================
function cabeceraReporte(data) {
    var header = function (currentPage, pageCount) {
        var pag = currentPage.toString() + ' de ' + pageCount;
        return [
            {
                columns: [
                    [{ image: 'logo', width: 52, opacity: 0.85, margin: [20, 12, 0, 0] }],
                    [
                        {
                            margin: [0, 17, 0, 0],
                            stack: [
                                {
                                    text: 'ADM Agroindustrial S.R.L',
                                    alignment: 'center',
                                    bold: true,
                                    style: 'letra11_5',
                                },
                                {
                                    text: 'Autopista Duarte Km0 El Higuero, La Vega',
                                    alignment: 'center',
                                    style: 'letra10',
                                },
                                {
                                    text: [
                                        { text: 'Telefono: ', style: 'letra9', bold: true },
                                        { text: environment_js_1.AppConfig.num_telefono, style: 'letra9' },
                                        { text: ' RNC: ', style: 'letra9', bold: true },
                                        { text: environment_js_1.AppConfig.rnc, style: 'letra9' },
                                    ],
                                    alignment: 'center',
                                },
                            ],
                        },
                    ],
                    [
                        {
                            text: [
                                { text: 'Pag... :  ', style: 'letra10', bold: true },
                                { text: pag, style: 'letra10' },
                            ],
                            alignment: 'left',
                            margin: [60, 19, 0, 0],
                        },
                        {
                            text: [
                                { text: 'Fecha : ', style: 'letra10', bold: true },
                                { text: data.fecha, style: 'letra10' },
                            ],
                            alignment: 'left',
                            margin: [60, 3, 0, 0],
                        },
                        {
                            text: [
                                { text: 'Emp... :  ', style: 'letra10', bold: true },
                                { text: data.realizado_por, style: 'letra10' },
                            ],
                            alignment: 'left',
                            margin: [60, 3, 0, 0],
                        },
                    ],
                ],
            },
            {
                text: [{ text: data.titulo_reporte, style: 'letra12', bold: true }],
                margin: [0, 15, 0, 0],
                alignment: 'center',
            },
            data.mostrar_sub_titulo
                ? {
                    text: data.sub_titulo,
                    style: 'letra10',
                    margin: [15, 10, 0, 0],
                }
                : { text: '' },
            {
                canvas: [{ type: 'rect', x: 10, y: data.mostrar_sub_titulo ? 5 : 20, w: 575, h: 1.5, color: '#000000' }],
            },
        ];
    };
    return header;
}
// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function contenidoReporte(data) {
    var titulos = [];
    var body = [];
    t_c[data.tipo_reporte].info.forEach(function (titulo, i) {
        titulos.push({
            text: titulo.text,
            alignment: titulo.alignment_titulo,
            style: titulo.style,
            bold: true,
            margin: titulo.margin_titulo ? titulo.margin_titulo : [0, 0, 0, 0],
        });
    });
    body.push(titulos);
    data.contenido_reporte.forEach(function (detalle, j) {
        var row = [];
        var brk = data.mostrar_sub_titulo ? t_c[data.tipo_reporte].break - 1 : t_c[data.tipo_reporte].break;
        var br_ = j !== 0 && j % brk === 0;
        t_c[data.tipo_reporte].info.forEach(function (info, i) {
            var obj = {};
            var text_ = '';
            if (info.key === 'index') {
                text_ = j + 1;
            }
            else {
                if (info.formato_fecha) {
                    text_ = fun_.my_dateFormater(detalle[info.key]);
                }
                else if (info.formato_numero) {
                    text_ = fun_.numFormatTwoDecimals(detalle[info.key]);
                }
                else {
                    text_ = detalle[info.key];
                }
            }
            obj = {
                text: text_,
                alignment: info.alignment_body,
                margin: info.margin_body ? info.margin_body : [0, 0, 0, 0],
                style: info.style_body,
                pageBreak: br_ ? 'before' : 'none',
            };
            row.push(obj);
        });
        body.push(row);
    });
    var content = [
        {
            table: {
                headerRows: 1,
                widths: t_c[data.tipo_reporte].widths,
                body: body,
            },
            margin: t_c[data.tipo_reporte].margin_general,
            layout: {
                hLineWidth: function (i, node) {
                    var brk = data.mostrar_sub_titulo ? t_c[data.tipo_reporte].break - 1 : t_c[data.tipo_reporte].break;
                    return i % brk === 0 && node.table.body.length !== brk ? 0 : i === node.table.body.length || i === 1 ? 1.5 : 1;
                },
                vLineWidth: function (i, node) {
                    return 0;
                },
                hLineColor: function (i, node) {
                    return i === node.table.body.length || i === 1 ? 'black' : 'gray';
                },
                vLineColor: function (i, node) {
                    return 'black';
                },
            },
        },
        data.mostrar_total
            ? {
                stack: [
                    {
                        margin: [0, 5, data.contenido_reporte.length <= t_c[data.tipo_reporte].break ? 24 : 43, 0],
                        columns: [
                            [],
                            [
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [
                                                {
                                                    alignment: 'right',
                                                    text: [
                                                        {
                                                            text: 'TOTAL RD$:         ',
                                                            style: 'letra10',
                                                            bold: true,
                                                        },
                                                        {
                                                            text: fun_.numFormatTwoDecimals(data.total),
                                                            style: 'letra10',
                                                            bold: true,
                                                        },
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
            }
            : { text: '' },
    ];
    return content;
}
var t_c = {
    ventas: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        widths: [24, 60, 73, 53, '*', 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Fecha',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'fecha_equivalente',
                alignment_body: 'left',
                formato_fecha: true,
            },
            {
                text: 'Factura',
                style: 'letra10',
                alignment_titulo: 'left',
                style_body: 'letra10',
                key: 'numero_comprobante',
                alignment_body: 'left',
            },
            {
                text: 'Condición',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'condicion',
                alignment_body: 'left',
            },
            {
                text: 'Cliente',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'cliente_nombre',
                alignment_body: 'left',
            },
            // {
            //   text: 'Descuento',
            //   alignment_titulo: 'right',
            //   margin_titulo: [0, 0, 20, 0],
            //   margin_body: [0, 0, 20, 0],
            //   style: 'letra10',
            //   style_body: 'letra10',
            //   key: 'descuento',
            //   alignment_body: 'right',
            //   formato_numero: true,
            // },
            {
                text: 'Total Venta',
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'total_factura',
                alignment_body: 'right',
                formato_numero: true,
            },
        ],
    },
    cxc: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        // widths: [24, 65, 75, 55, '*', 'auto', 'auto'],
        widths: [24, 60, 73, 53, '*', 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Fecha',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'fecha_equivalente',
                alignment_body: 'left',
                formato_fecha: true,
            },
            {
                text: 'Factura',
                style: 'letra10',
                alignment_titulo: 'left',
                style_body: 'letra10',
                key: 'numero_comprobante',
                alignment_body: 'left',
            },
            {
                text: 'Condición',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'condicion',
                alignment_body: 'left',
            },
            {
                text: 'Cliente',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'cliente_nombre',
                alignment_body: 'left',
            },
            // {
            //   text: 'Descuento',
            //   alignment_titulo: 'right',
            //   margin_titulo: [0, 0, 20, 0],
            //   margin_body: [0, 0, 20, 0],
            //   style: 'letra10',
            //   style_body: 'letra10',
            //   key: 'descuento',
            //   alignment_body: 'right',
            //   formato_numero: true,
            // },
            {
                text: 'Pendiente',
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'balance',
                alignment_body: 'right',
                formato_numero: true,
            },
        ],
    },
    //
    //
    //
    //
    cxc_ant: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        // widths: [24, 65, 75, 55, '*', 'auto', 'auto'],
        widths: [24, '*', 70, 70, 70, 70, 70, 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Cliente',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'cliente_nombre',
                alignment_body: 'left',
            },
            {
                text: 'RNC',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'cliente_rnc',
                alignment_body: 'left',
            },
            {
                text: '0 - 30 Dias',
                style: 'letra10',
                alignment_titulo: 'left',
                style_body: 'letra10',
                key: 'cero_to_treinta',
                alignment_body: 'left',
            },
            {
                text: '31 - 60 Dias',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'treinta_uno_to_sesenta',
                alignment_body: 'left',
            },
            {
                text: '61 - 90 Dias',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'sesenta_uno_to_noventa',
                alignment_body: 'left',
            },
            {
                text: 'mas 91 Dias',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'noventa_uno_to_more',
                alignment_body: 'left',
            },
            {
                text: 'Pendiente',
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'balance',
                alignment_body: 'right',
                formato_numero: true,
            },
        ],
    },
    inventario: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        widths: [24, 35, '*', 'auto', 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Cod.',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'codigo',
                alignment_body: 'left',
            },
            {
                text: 'Articulo',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'nombre',
                alignment_body: 'left',
            },
            {
                text: 'Cantidad',
                style: 'letra10',
                alignment_titulo: 'center',
                style_body: 'letra10',
                key: 'cantidad_principal',
                alignment_body: 'center',
            },
            {
                text: 'Precio',
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'precio_principal',
                alignment_body: 'right',
                formato_numero: true,
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
            },
        ],
    },
    recibos: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        widths: [24, 60, 70, '*', 50, 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Fecha',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'fecha_equivalente',
                alignment_body: 'left',
                formato_fecha: true,
            },
            {
                text: 'Factura',
                style: 'letra10',
                alignment_titulo: 'left',
                style_body: 'letra10',
                key: 'factura',
                alignment_body: 'left',
            },
            {
                text: 'Cliente',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'cliente_nombre',
                alignment_body: 'left',
            },
            {
                text: 'Tipo',
                style: 'letra10',
                alignment_titulo: 'center',
                style_body: 'letra10',
                key: 'tipo_recibo',
                alignment_body: 'center',
            },
            {
                text: 'Recibido',
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'total',
                alignment_body: 'right',
                formato_numero: true,
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
            },
        ],
    },
    ventas_prod: {
        margin_general: [10, 0, 10, 0],
        break: 40,
        widths: [24, '*', 'auto', 'auto'],
        info: [
            {
                text: '#',
                alignment_titulo: 'center',
                style: 'letra10',
                style_body: 'letra10',
                key: 'index',
                alignment_body: 'center',
            },
            {
                text: 'Articulo',
                alignment_titulo: 'left',
                style: 'letra10',
                style_body: 'letra10',
                key: 'nombre',
                alignment_body: 'left',
            },
            {
                text: 'Medida',
                style: 'letra10',
                alignment_titulo: 'left',
                style_body: 'letra10',
                key: 'medida_mostrar',
                alignment_body: 'left',
            },
            {
                text: 'Total Vendido',
                alignment_titulo: 'right',
                style: 'letra10',
                style_body: 'letra10',
                key: 'total_vendido',
                alignment_body: 'right',
                formato_numero: true,
                margin_titulo: [0, 0, 10, 0],
                margin_body: [0, 0, 10, 0],
            },
        ],
    },
};
