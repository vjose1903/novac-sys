export enum reportField {
  dynamicSelection = 'dynamicSelection',
  customerField = 'customerField',
  serieField = 'serieField',
  conditionField = 'conditionField',
  typeField = 'typeField',
  billTypeField = 'billTypeField',
  articuloField = 'articuloField',
  dateField = 'dateField',
  fromField = 'fromField',
  toDateField = 'toDateField',
  switchGroupField = 'switchGroupField',
  simpleSwitchField = 'simpleSwitchField',
}

export interface dynamicFieldOption {
  label: string;
  value: any;
}

export interface dynamicFieldConfig {
  id?: string;
  label: string;
  formControl: string;
  validators?: any;
  defaultValue?: any;
  initialValue?: any;
  placeholder?: string;
  items?: dynamicFieldOption[] | any[];
  optionLabel?: string | null;
  optionValue?: string | null;
  notFoundText?: string;
  searchFunction?: (value?: string) => void;
  blurFunction?: () => void;
  disabledFunction?: () => boolean;
  controlType?: 'select' | 'multiselect' | 'switch';
  required?: boolean;
}

export interface switchGroup {
  title: string;
  array: { label: string; value: any }[];
}

export const formControlMap = {
  [reportField.articuloField]: 'articulo_id',
  [reportField.customerField]: 'cliente_id',
  [reportField.conditionField]: 'condicion',
  [reportField.fromField]: 'desde',
  [reportField.dateField]: 'fecha',
  [reportField.toDateField]: 'hasta',
  [reportField.serieField]: 'serie',
  [reportField.typeField]: 'tipo',
  [reportField.billTypeField]: 'tipo_factura_id',
};
