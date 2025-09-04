/* eslint-disable @typescript-eslint/indent */
import { getContentWithTablaNormal } from './tabla_normal';

export function getContentWithTablaAgrupada(configuracion, data, is_electronica = false) {
  const content = [];

  for (let index_contenido = 0; index_contenido < data.contenido_reporte.length; index_contenido++) {
    // const detalle = data.contenido_reporte[i];
    let cont_ = [];

    for (let index_info = 0; index_info < configuracion.info.length; index_info++) {
      const config = configuracion.info[index_info];

      const tabla = getContentWithTablaNormal({ configuration: config, data, is_electronica, index_data: index_contenido, index_info });

      cont_.push(tabla);
    }

    if (index_contenido > 0) cont_ = [getRaya(configuracion), ...cont_];

    if (data.contenido_reporte[index_contenido].contenido_titulo === 'TOTAL GENERAL') {
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
        canvas: [{ type: 'rect', x: 0, y: 0, w: pageO == 'portrait' ? 587 : 823, h: 2, color: '#000000' }],
      },
    ],
  };
}
