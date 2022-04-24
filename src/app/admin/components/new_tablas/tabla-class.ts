export enum medidas {
  Libra = 'Libras',
  Quintal = 'Quintales',
  Caja = 'Cajas',
  Paquete = 'Paquetes',
  Unidad = 'Unidades',
  Saco = 'Sacos',
}

export class TablaClass {
  handle_table_events(event) {
    switch (event.type) {
      case 'click_action':
        this.tableClick_action(event.info);
        break;

      case 'clickRow':
        this.tableClickRow(event.info);
        break;

      case 'clickIcon':
        this.tableClickIcon(event.info);
        break;

      default:
        break;
    }
  }

  tableClick_action(arg) {}
  tableClickRow(arg) {}
  tableClickIcon(arg) {}
}
