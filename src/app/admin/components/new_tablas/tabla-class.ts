export class TablaClass {
  handle_table_events(event) {
    switch (event.type) {
      case 'click_action':
        this.tableClick_action({ info: event.info, id_tabla: event.id_tabla });
        break;

      case 'clickRow':
        this.tableClickRow({ info: event.info, id_tabla: event.id_tabla });
        break;

      case 'clickIcon':
        this.tableClickIcon({ info: event.info, id_tabla: event.id_tabla });
        break;

      case 'delete':
        this.modalDelete({ info: event.info, id_tabla: event.id_tabla });
        break;

      default:
        break;
    }
  }

  tableClick_action(arg) {}
  modalDelete(arg) {}
  tableClickRow(arg) {}
  tableClickIcon(arg) {}
}
