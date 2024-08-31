export type tableRowType = 'inputSwitch' | 'index' | 'cantidades' | 'img' | 'icon' | 'tag' | 'color' | 'switch' | 'dropDown' | 'input' | 'text' | 'tag' | 'formatoNumero' | 'textList' | 'date';

export interface table_info {
  id?: string;
  titulo?: string;
  titulo_sm?: string;
  key?: string;
  dropdown_key?: string;
  tipo?: tableRowType;
  tag_severity?: string;
  remplace?: any;
  data?: any;
  placeholder?: string;
  optionLabel?: any;
  optionValue?: any;
  estilos?: Array<any>;
  style?: any;
  select_all?: boolean;
  alert_msg?: string;
  checkNumber?: boolean;
  can_reset?: boolean;
  inputType?: string;
  inputEvents?: string;
  textAlign?: 'start' | 'center' | 'end';
  tooltip?: string;
  column_gap?: string;
  rowTooltip?: string;
  alerta?: boolean;
  tag_color?: string;
  row_tag_color?: string;
  tag_apretada?: boolean;
  con_hora?: boolean;
  disable?: any;
  color?: string;
  text_color?: string;
  dateFormat?: any;
  hours?: any;
  imgStyle?: 'circular' | 'cuadrada';
  rowImgStyle?: 'circular' | 'cuadrada';
  src?: any;
  alt?: any;
  rowAlt?: any;
  click?: Function;
  iconsArray?: Array<iconsI>;
  key_value?: string;
  div_class?: string;
}

interface keySourceArray {
  value: any;
  clase: string;
}

interface keySource {
  key: string;
  source: string;
  clases: Array<keySourceArray>;
}

interface iconsI {
  id?: string | number;
  key: string | keySource;
  rowTooltip?: string;
  tooltip?: string;
  style?: any;
  text_color?: string;
  showCondition?: Array<any>;
  editing_buttons?: boolean;
  one_per_row?: boolean;
  table_component_function?: Function;
  disable?: Array<iconDisableItem>;
}

export interface iconDisableItem {
  kind?: 'always' | 'selected' | 'has_value' | 'campo';
  target?: string;
  value?: Array<any>;
}
export interface paginateI {
  show?: boolean;
  showTotal?: boolean;
  showDropDown?: boolean;
  page?: number;
  page_front?: number;
  ant_page?: number;
  per_page?: number;
  per_page_options?: Array<number>;
  search?: string;
  is_local?: boolean;
}

export interface btnTableI {
  btn_id?: string;
  show: boolean;
  name?: string;
  tooltip?: string;
  tooltipKey?: string;
  permiso?: string | string[];
  icon?: string;
}

export interface botonesTableI {
  dinamico?: Array<btnTableI>;
  borrar?: btnTableI;
  editar?: btnTableI;
  mostrar?: btnTableI;
  styles?: any;
}

interface padreFunctionsI {
  handleBtnsDinamic?: Function;
  data_request?: Function;
}
interface filtarI {
  show?: boolean;
  local?: boolean;
}

export interface table_config {
  focusSearchInput?: boolean;
  padding?: string;
  padre_functions?: padreFunctionsI;
  colores?: Boolean;
  redondo?: Boolean;
  colorTitulo?: Boolean;
  read?: Boolean;
  focusRow?: Boolean;
  extraCalculo?: Number;
  filtrar?: filtarI;
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
  Galon = 'Galones',
  Onza = 'Onzas',
  Producto = 'Productos',
  Funda = 'Fundas',
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

      case 'inputChange':
        this.tableInputChange(event.info);
        break;

      case 'inputBlur':
        this.tableInputBlur(event.info);
        break;

      default:
        break;
    }
  }

  tableClick_action(arg) {}
  tableClickRow(arg) {}
  tableClickIcon(arg) {}
  tableInputChange(arg) {}
  tableInputBlur(arg) {}
}
