export interface IAutoCompleteBtnNewOption {
  id: string;
  btnAddLabel: string;
  btnAddClass?: string;
  type?: any;
}

export interface IAutoCompleteConfig {
  label: string;
  optionDescriptor?: string;
  dropdown?: boolean;
  required?: boolean;
  placeholder: string;
  keyLabel: string;
  keyValue?: string;
  extraFilterSuggestions?: (config: IAutoCompleteConfig) => any;
  processData?: (config: IAutoCompleteConfig, allData?: any, data?: any) => any;
  processNewOption?: (config: IAutoCompleteConfig, btn: IAutoCompleteBtnNewOption) => any;
  functionIsSelected?: (config: IAutoCompleteConfig, data: any) => any;

  btnsNewOption?: Array<IAutoCompleteBtnNewOption>;

  dynamicChipClass?: (config: IAutoCompleteConfig, data: any) => string;
}
