export const makeFileName = (datos: string, prefix: string) => {
    let sufix = '';

    const clienteDesdeHastaRegex = /Cliente:\s*(.+?),\s*Desde:\s*(\d{2}\/\d{2}\/\d{4}),\s*Hasta:\s*(\d{2}\/\d{2}\/\d{4})/;
    const matchClienteDesdeHasta = datos.match(clienteDesdeHastaRegex);

    if (matchClienteDesdeHasta) {
        const cliente = matchClienteDesdeHasta[1].split(' ')[0];
        const desde = matchClienteDesdeHasta[2].replace(/\//g, '-');
        const hasta = matchClienteDesdeHasta[3].replace(/\//g, '-');
        sufix = `${cliente}_${desde}_${hasta}`
    }
    
    
    return `${prefix}_${sufix}.csv`;
};
