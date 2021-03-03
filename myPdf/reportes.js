"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeReporte = void 0;
var files_1 = require("./utils/files");
var environment_js_1 = require("../src/environments/environment.js");
var configuracion_tablas_1 = require("./configuracion_tablas");
var tabla_normal_1 = require("./tabla_normal");
var tabla_agrupada_1 = require("./tabla_agrupada");
// ==========================================================================================================================================================
// UNIR REPORTE
// ==========================================================================================================================================================
function makeReporte(data) {
    var configuration = configuracion_tablas_1.getConfiguration(data.tipo_reporte);
    var pageO = configuration['pageOrient'] ? configuration['pageOrient'] : 'portrait';
    var dd = {
        // pageSize: { width: 990, height: 398 },
        pageMargins: [0, data.mostrar_sub_titulo ? 118.5 : 111.5, 0, 30],
        pageOrientation: pageO,
        header: cabeceraReporte(data, pageO),
        content: contenidoReporte(data, configuration),
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
function cabeceraReporte(data, pageO) {
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
                            margin: [pageO === '' ? 60 : 80, 19, 0, 0],
                        },
                        {
                            text: [
                                { text: 'Fecha : ', style: 'letra10', bold: true },
                                { text: data.fecha, style: 'letra10' },
                            ],
                            alignment: 'left',
                            margin: [pageO === '' ? 60 : 80, 3, 0, 0],
                        },
                        {
                            text: [
                                { text: 'Emp... :  ', style: 'letra10', bold: true },
                                { text: data.realizado_por, style: 'letra10' },
                            ],
                            alignment: 'left',
                            margin: [pageO === '' ? 60 : 80, 3, 0, 0],
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
            data.tipo_tabla === 'normal'
                ? {
                    canvas: [
                        {
                            type: 'rect',
                            x: 10,
                            y: data.mostrar_sub_titulo ? 5 : 20,
                            w: pageO === 'portrait' ? 575 : 823,
                            h: 1.5,
                            color: '#000000',
                        },
                    ],
                }
                : { text: '' },
        ];
    };
    return header;
}
// ==========================================================================================================================================================
// CONTENIDO
// =========================================================~=================================================================================================
function contenidoReporte(data, configuration) {
    var content = [];
    if (data.tipo_tabla === 'agrupado') {
        content = tabla_agrupada_1.getContentWithTablaAgrupada(configuration, data);
    }
    else {
        content = tabla_normal_1.getContentWithTablaNormal(configuration, data);
    }
    return content;
}
