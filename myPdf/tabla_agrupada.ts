import { getTablaNormal } from './tabla_normal';

export function getContentWithTablaAgrupada(configuracion, data) {
  console.log('configuracion.info.length --> ', configuracion.info.length);
  console.log('data.contenido_reporte.length --> ', data.contenido_reporte.length);
  const content = [];

  for (let i = 0; i < data.contenido_reporte.length; i++) {
    // const detalle = data.contenido_reporte[i];
    console.log('-------------- DETALLE ', i + 1, '--------------');
    const cont_ = [];

    for (let j = 0; j < configuracion.info.length; j++) {
      console.log('-------------- CONFIGURACION ', j + 1, '--------------');
      const config = configuracion.info[j];

      cont_.push(getTablaNormal(config, data, i, j));
    }

    content.push({
      stack: cont_,
      unbreakable: true,
    });
  }

  return content;
}
