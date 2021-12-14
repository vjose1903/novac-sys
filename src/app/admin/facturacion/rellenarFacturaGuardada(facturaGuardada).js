rellenarFacturaGuardada(facturaGuardada) {
    return new Promise((resolve) => {
      let obj = { texto_modal: '' };

      const factura_para_comparar = GLOBAL.duplicarJson(facturaGuardada, false);

      this.fun.logYellow('this.factura_para_comparar --> ', factura_para_comparar);
      this.fun.logGreen('this.checkIfFacturacionEnProceso() --> ', this.checkIfFacturacionEnProceso());

      if (this.checkIfFacturacionEnProceso()) {
        if (this.archivo_id_desplegada) {
          // revisar si la factura que esta en proceso es igual a la factura que se va a rellenar
          this.facturasSonIguales(factura_para_comparar).then((res_fact_a_rellenar) => {
            console.log('RES ', res_fact_a_rellenar);

            if (!res_fact_a_rellenar) {
              // revisar si la factura que esta en proceso se ha modificado para sobreescribirla
              this.facturasSonIguales().then((res_fact_en_curso) => {
                if (res_fact_en_curso) {
                  this.procesoRelleno(facturaGuardada);
                } else {
                  obj.texto_modal = 'La factura que esta en proceso ya se encuentra archivada ¿desea sobreescribirla?';
                  console.log('ABRIR EL MODAL ');
                  console.log('obj ', obj);
                  this.abrirModal('dinamico_texto', obj, 'desplegar_factura');
                }
              });
            } else this.procesoRelleno(facturaGuardada);
          });
        } else {
          obj.texto_modal = '¿Desea archivar la factura que esta en proceso?';

          console.log('ABRIR EL MODAL ');
          console.log('obj ', obj);

          this.abrirModal('dinamico_texto', obj, 'desplegar_factura');
        }

        resolve(true);
      } else {
        this.procesoRelleno(facturaGuardada).then(() => {
          console.log('response de procesoRelleno ');

          resolve(true);
        });
      }
    });
  }





