"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentWithTablaAgrupada = void 0;
var tabla_normal_1 = require("./tabla_normal");
function getContentWithTablaAgrupada(configuracion, data) {
    console.log('configuracion.info.length --> ', configuracion.info.length);
    console.log('data.contenido_reporte.length --> ', data.contenido_reporte.length);
    var content = [];
    for (var i = 0; i < data.contenido_reporte.length; i++) {
        // const detalle = data.contenido_reporte[i];
        console.log('-------------- DETALLE ', i + 1, '--------------');
        var cont_ = [];
        for (var j = 0; j < configuracion.info.length; j++) {
            console.log('-------------- CONFIGURACION ', j + 1, '--------------');
            var config = configuracion.info[j];
            cont_.push(tabla_normal_1.getTablaNormal(config, data, i, j));
        }
        content.push({
            stack: cont_,
            unbreakable: true,
        });
    }
    return content;
}
exports.getContentWithTablaAgrupada = getContentWithTablaAgrupada;
