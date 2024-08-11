export interface IAutoCompleteBtnNewOption {
  id: string;
  btnAddLabel: string;
  btnAddClass?: string;
  type?: any;
}

export interface IAutoCompleteConfig {
  label: string;
  fieldId?: string;
  optionDescriptor?: string;
  dropdown?: boolean;
  required?: boolean;
  placeholder: string;
  keyLabel: string;
  keyValue?: string;
  noOptionFoundMessage?: string;
  canCreateNewOptions?: boolean;
  extraFilterSuggestions?: (config: IAutoCompleteConfig) => any;
  functionIsSelected?: (config: IAutoCompleteConfig, data: any) => any;

  btnsNewOption?: Array<IAutoCompleteBtnNewOption>;

  dynamicChipClass?: (config: IAutoCompleteConfig, data: any) => string;
}
