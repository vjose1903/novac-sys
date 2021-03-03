"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentWithTablaAgrupada = void 0;
var tabla_normal_1 = require("./tabla_normal");
function getContentWithTablaAgrupada(configuracion, data) {
    var content = [];
    for (var i = 0; i < data.contenido_reporte.length; i++) {
        // const detalle = data.contenido_reporte[i];
        var cont_ = [];
        for (var j = 0; j < configuracion.info.length; j++) {
            var config = configuracion.info[j];
            cont_.push(tabla_normal_1.getTablaNormal(config, data, i, j));
        }
        cont_ = __spreadArrays([getRaya(configuracion)], cont_);
        if (data.contenido_reporte[i].titulo_grupo === 'TOTAL GENERAL') {
            content.push({
                stack: cont_,
                unbreakable: true,
            });
        }
        else {
            content.push(cont_);
        }
    }
    return content;
}
exports.getContentWithTablaAgrupada = getContentWithTablaAgrupada;
function getRaya(configuracion) {
    var pageO = configuracion['pageOrient'] ? configuracion['pageOrient'] : 'portrait';
    return {
        canvas: [
            {
                type: 'rect',
                x: 10,
                y: 0,
                w: pageO === 'portrait' ? 575 : 823,
                h: 1.5,
                color: '#000000',
            },
        ],
    };
}
