"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeTablaNormal = exports.getTablaNormal = exports.getContentWithTablaNormal = void 0;
var fun_ = require("./utils/funciones");
function getContentWithTablaNormal(configuration, data) {
    return this.makeTablaNormal(configuration, data);
}
exports.getContentWithTablaNormal = getContentWithTablaNormal;
function getTablaNormal(configuration, data, index_data, index_info) {
    return this.makeTablaNormal(configuration, data, index_data, index_info);
}
exports.getTablaNormal = getTablaNormal;
function makeTablaNormal(configuration, data, index_data, index_info) {
    console.log('configuration --> ', configuration);
    console.log('data --> ', data);
    console.log('index_data --> ', index_data);
    console.log('index_info --> ', index_info);
    var data_ = data.tipo_tabla === 'normal' ? data : data.contenido_reporte[index_data];
    var contendio_ = data.tipo_tabla === 'normal' ? data.contenido_reporte : data.contenido_reporte[index_data].contenido_grupo;
    var titulos = [];
    var body = [];
    configuration.info.forEach(function (titulo_config, i) {
        try {
            var obj_titulo = {
                text: configuration.only_titulo ? data_[titulo_config.key] : titulo_config.text,
                alignment: titulo_config.alignment_titulo,
                style: titulo_config.style,
                bold: true,
                noWrap: titulo_config.noWrap,
                margin: titulo_config.margin_titulo ? titulo_config.margin_titulo : [0, 0, 0, 0],
            };
            if (titulo_config.fillColor)
                obj_titulo['fillColor'] = titulo_config.fillColor;
            titulos.push(obj_titulo);
        }
        catch (error) {
            console.error(':::::::: error=> ', error);
        }
    });
    // if (data.tipo_tabla === 'agrupado') {
    //   body.push({
    //     canvas: [{ type: 'rect', x: 10, y: data.mostrar_sub_titulo ? 5 : 20, w: 575, h: 1.5, color: '#000000' }],
    //   });
    // }
    if (contendio_.length > 0 || configuration.only_titulo) {
        body.push(titulos);
    }
    if (contendio_.length > 0 && !configuration.only_titulo) {
        console.log('CONFIGURATION.WIDTHS --> ', configuration.widths);
        contendio_.forEach(function (detalle, j) {
            var row = formarCuerpo(data, configuration, detalle, j);
            body.push(row);
        });
    }
    // } else if (data.tipo_tabla === 'agrupado' && !configuration.only_titulo) {
    //   data.contenido_reporte[index_data].contenido_grupo.forEach((detalle, j) => {
    //     const row = formarCuerpo(data, configuration, detalle, j);
    //     body.push(row);
    //   });
    // }
    var content = [
        contendio_.length > 0 || configuration.only_titulo
            ? {
                table: {
                    headerRows: 1,
                    widths: configuration.widths,
                    body: body,
                },
                margin: configuration.margin_general,
                layout: {
                    hLineWidth: function (i, node) {
                        // const brk = data.mostrar_sub_titulo ? configuration.break - 1 : configuration.break;
                        var brk = configuration.break;
                        if (configuration.isBreak) {
                            return i == 0 ? 0 : 1 === 1 ? 1.5 : 1;
                        }
                        else {
                            return i % brk === 0 && node.table.body.length !== brk ? 0 : i === node.table.body.length || i === 1 ? 1.5 : 1;
                        }
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
            }
            : { text: '' },
        configuration.mostrar_total && data.total > 0.99999
            ? {
                stack: [
                    {
                        margin: [0, 5, contendio_.length <= configuration.break ? 24 : 43, 0],
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
                                                            text: fun_.numFormatTwoDecimals(data_.total),
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
    console.log('------------------------------------------------------------------------------------------------------------------- ');
    console.log(' ');
    return content;
}
exports.makeTablaNormal = makeTablaNormal;
function formarCuerpo(data, configuration, detalle, j) {
    var row = [];
    var brk = data.mostrar_sub_titulo ? configuration.break - 1 : configuration.break;
    var br_ = j !== 0 && j % brk === 0;
    configuration.info.forEach(function (info, i) {
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
            noWrap: info.noWrap,
            pageBreak: configuration.isBreak ? (br_ ? 'before' : 'none') : 'none',
        };
        if (info.fillColor)
            obj['fillColor'] = info.fillColor;
        row.push(obj);
    });
    return row;
}
