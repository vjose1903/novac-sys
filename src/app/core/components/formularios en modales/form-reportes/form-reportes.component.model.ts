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
