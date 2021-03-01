"use strict";
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
