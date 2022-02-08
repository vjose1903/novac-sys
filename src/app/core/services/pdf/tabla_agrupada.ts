/* eslint-disable @typescript-eslint/indent */
import { getTablaNormal } from './tabla_normal';

export function getContentWithTablaAgrupada(configuracion, data) {
  const content = [];

  for (let i = 0; i < data.contenido_reporte.length; i++) {
    // const detalle = data.contenido_reporte[i];
    let cont_ = [];
    for (let j = 0; j < configuracion.info.length; j++) {
      const config = configuracion.info[j];
      const tabla = getTablaNormal(config, data, i, j);
      cont_.push(tabla);
    }
    if (i > 0) cont_ = [getRaya(configuracion), ...cont_];

    if (data.contenido_reporte[i].contenido_titulo === 'TOTAL GENERAL') {
      content.push({ stack: cont_, unbreakable: true });
    } else {
      content.push(cont_);
    }
  }

  return content;
}

function getRaya(configuracion) {
  const pageO = configuracion['pageOrient'] ? configuracion['pageOrient'] : 'portrait';
  return {
    stack: [
      {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: pageO === 'portrait' ? 575 : 823,
            h: 2,
            color: '#000000',
          },
        ],
      },
    ],
  };
}
