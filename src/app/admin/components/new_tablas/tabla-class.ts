export interface table_info {
  titulo?: string;
  titulo_sm?: string;
  tooltip?: string;
  key?: string;
  tipo?: string;
  tag_severity?: string;
  remplace?: any;
  data?: any;
  placeholder?: string;
  optionLabel?: any;
  optionValue?: any;
  estilos?: Array<any>;
  inputType?: string;
  rowTooltip?: string;
  alerta?: boolean;
  tag_color?: string;
  tag_apretada?: boolean;
  disable?: any;
  color?: string;
  text_color?: string;
  dateFormat?: any;
  hours?: any;
  src?: any;
  alt?: any;
  click?: Function;
  iconsArray?: Array<any>;
  key_value?: string;
}

export interface paginateI {
  show?: boolean;
  page?: number;
  ant_page?: number;
  per_page?: number;
  per_page_options?: Array<number>;
  search?: string;
  is_local?: boolean;
}

interface inner_btn {
  show: boolean;
  name?: string;
  tooltip?: string;
  tooltipKey?: string;
  permiso?: string;
  icon?: string;
}

export interface botonesTableI {
  dinamico?: Array<inner_btn>;
  borrar?: inner_btn;
  editar?: inner_btn;
  mostrar?: inner_btn;
}

interface padreFunctionsI {
  handleBtnsDinamic?: Function;
  data_request?: Function;
}

export interface table_config {
  padding?: string;
  padre_functions?: padreFunctionsI;
  colores?: Boolean;
  read?: Boolean;
  focusRow?: Boolean;
  extraCalculo?: Number;
  filtrar?: any;
  localFilter?: Boolean;
  filterTargets?: any;
  id?: String;
  id_tabla?: String;
  info?: Array<table_info>;
  data_request?: any;
  table_size?: 'sm';
  backgroundColor?: any;
  total_count?: any;
  obj_paginate?: paginateI;
  botones?: botonesTableI;
}

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
