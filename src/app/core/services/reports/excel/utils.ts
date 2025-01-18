import { fun } from '../../functions.service';
export const makeFileName = (datos: string, prefix: string) => {
  let sufix = '';

  const clienteDesdeHastaRegex = /Cliente:\s*(.+?),\s*Desde:\s*(\d{2}\/\d{2}\/\d{4}),\s*Hasta:\s*(\d{2}\/\d{2}\/\d{4})/;
  const matchClienteDesdeHasta = datos.match(clienteDesdeHastaRegex);

  const DesdeHastaRegex = /(?:desde[:\s]*\s*)?(\d{2}\/\d{2}\/\d{4})\s*[,]*\s*(hasta|y)?[:\s]*\s*(\d{2}\/\d{2}\/\d{4})/i;
  const matchDesdeHasta = datos.match(DesdeHastaRegex);

  const fechaRegex = /Fecha:\s*(\d{2}\/\d{2}\/\d{4})/;
  const matchFecha = datos.match(fechaRegex);

  const clienteRegex = /Cliente:\s*(.+)/;
  const matchcliente = datos.match(clienteRegex);


  if (matchClienteDesdeHasta) {
    const cliente = matchClienteDesdeHasta[1].split(' ')[0];
    const desde = matchClienteDesdeHasta[2].replace(/\//g, '-');
    const hasta = matchClienteDesdeHasta[3].replace(/\//g, '-');
    sufix = `${cliente}_${desde}_${hasta}`;
  } else if (matchDesdeHasta) {
    const desde = matchDesdeHasta[1].replace(/\//g, '-');
    const hasta = matchDesdeHasta[3].replace(/\//g, '-');
    sufix = `${desde}_${hasta}`;
  } else if (matchFecha) {
    const fecha = matchFecha[1].replace(/\//g, '-');
    sufix = `${fecha}`;
  } else if (matchcliente) {
    const cliente = matchcliente[1].split(' ')[0];
    sufix = `${cliente}`;
  }

  return `${prefix}${fun.hasValue(sufix) ? `_${sufix}` : ''}.xlsx`.toLowerCase();
};
