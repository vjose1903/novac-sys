import { getTablaNormal } from './tabla_normal';

export function getContentWithTablaAgrupada(configuracion, data) {
  const content = [];

  for (let i = 0; i < data.contenido_reporte.length; i++) {
    // const detalle = data.contenido_reporte[i];
    const cont_ = [];

    for (let j = 0; j < configuracion.info.length; j++) {
      const config = configuracion.info[j];

      cont_.push(getTablaNormal(config, data, i, j));
    }

    if (data.contenido_reporte[i].titulo_grupo === 'TOTAL GENERAL') {
      content.push({
        stack: cont_,
        unbreakable: true,
      });
    } else {
      content.push(cont_);
    }
  }

  return content;
}
