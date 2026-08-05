import { EFontAwesomeIcon, fontAwesome } from '@core/typescript/fontawesome';
import { DynamicModalClass } from './dynamic-modal.class';
import { DynamicModalComponent } from '../dynamic-modal.component';

export interface IModalComponent {
  id?: any;
  modalsConfig?: Array<IModalConfiguration>;
  confirmToClose?: (modalId: any) => void;
  handleCloseModal?: (modalId: any, dataToReturn?: ICallbackModal) => void;
  changeModalConfig?: (changes: IModalConfiguration, modalId: any) => void;
  changeStateButton?: (params: { modalId: string; btnId: string; disable: boolean }) => string;
  hasAnyBtn?: (dynamicModal: DynamicModalClass) => boolean;
}

export interface IDynamicModal {
  modalConfig: IModalConfiguration;
  modalWrapper: DynamicModalComponent;
  submit?: (arg?: any) => any;
  showConfirmAlert?: () => boolean;
}

export interface ICallbackModal {
  data: any;
  modalId?: any;
  extra?: any;
  type?: modalCloseType;
  hasReturnData?: boolean;
}

export interface IBtnDisableFunction {
  function: () => boolean;
}

export interface IButtonDynamic {
  id?: string;
  show?: boolean;
  disable?: boolean | IBtnDisableFunction;
  tooltip?: string;
  clase: string;
  label: string;
  iconName?: string | null;
  iconSize?: string;
  iconColor?: string;
  showProcess?: boolean;
  processing?: boolean;
  action?: modalActionsE;
  function?: (modalComponent: DynamicModalClass) => any;
  functionInOtherComponent?: string;
}

export interface IModalConfiguration {
  id?: string | undefined;
  visible?: boolean;
  header?: string;
  inputs?: any;
  component?: any;
  componentInstance?: IDynamicModal;
  modalWrapper?: IModalComponent;
  width?: string;
  height?: string;
  baseZIndex?: number;
  botones?: Array<IButtonDynamic>;
  resizable?: boolean;
  html?: string | undefined;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  transitionOptions?: string;
  contentStyleClass?: string;
  maximizable?: boolean;
  closable?: boolean;
  closableEsc?: boolean;
  closableClickOutside?: boolean;
  confirmToClose?: boolean;
  disableAllButtonsIfAnyProcessing?: boolean;
  focusOnShow?: boolean;
  secondDetectChanges?: boolean;

  close?: (dataToReturn?: any) => void;
  show?: () => void;
  [prop: string]: any;
}

export type CallbackFunction = (args: ICallbackModal) => void;

export enum modalActionsE {
  close = 'close',
}

export enum modalCloseType {
  returnData = 'returnData',
  onHide = 'onHide',
}

export enum confirmationButtons {
  siNo = 'si-no',
  siNoCancelar = 'si-no-cancelar',
  cancelarContinuar = 'cancelar-continuar',
  cancelarEliminar = 'cancelar-eliminar',
  copiarSalir = 'copiar-salir',
  cancelarNuevaCopiar = 'cancelar-nueva-copiar',
  continuarOSalir = 'cancelar-salir',
  cancelarRemover = 'cancelar-remover',
  cancelarDesactivar = 'cancelar-desactivar',
  cancelarAnular = 'cancelar-anular',
  cancelarRechazar = 'cancelar-rechazar',
  cancelarActivar = 'cancelar-activar',
  cancelarAceptar = 'cancelar-aceptar',
  cancelarCerrar = 'cancelar-cerrar',
  ok = 'ok',
}

export interface IConfirmBtnConfig {
  [prop: string]: IConfirmationButtonOption;
}

export interface IConfirmationButtonOption {
  noBtn?: IConfirmationButtonProps;
  cancelarBtn?: IConfirmationButtonProps;
  siBtn: IConfirmationButtonProps;
}

export interface IConfirmationButtonProps {
  label: string;
  icon: EFontAwesomeIcon | null;
  iconColor?: string;
  clase: string;
  showProcess: boolean;
  id: string;
}

export const confirmBtnConfig: IConfirmBtnConfig = {
  [confirmationButtons.siNo]: {
    noBtn: { label: 'No', icon: fontAwesome.faSolid.x, iconColor: 'var(--app-button-cancel-icon)', clase: 'btn-light-grey', showProcess: false, id: 'btnNo' },
    siBtn: { label: 'Si', icon: fontAwesome.faSolid.check, iconColor: 'white', clase: 'btn-green', showProcess: false, id: 'btnSi' },
  },
  [confirmationButtons.siNoCancelar]: {
    cancelarBtn: { label: 'Cancelar', icon: null, clase: 'btn-gray', showProcess: false, id: 'btnCancelar' },
    noBtn: { label: 'No', icon: fontAwesome.faSolid.x, iconColor: 'var(--app-button-cancel-icon)', clase: 'btn-light-grey', showProcess: false, id: 'btnNo' },
    siBtn: { label: 'Si', icon: fontAwesome.faSolid.check, iconColor: 'white', clase: 'btn-green', showProcess: false, id: 'btnSi' },
  },
  [confirmationButtons.cancelarContinuar]: {
    noBtn: { label: 'Cancelar', icon: fontAwesome.faSolid.x, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Continuar', icon: fontAwesome.faSolid.check, clase: 'btn-green', showProcess: false, id: 'btnCancelar' },
  },
  [confirmationButtons.cancelarEliminar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Eliminar', icon: fontAwesome.faSolid.trashCan, clase: 'btn-danger', showProcess: true, id: 'btnEliminar' },
  },
  [confirmationButtons.cancelarRemover]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Remover', icon: fontAwesome.faSolid.trashCan, clase: 'btn-danger', showProcess: true, id: 'btnRemover' },
  },
  [confirmationButtons.cancelarDesactivar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Desactivar', icon: fontAwesome.faSolid.ban, clase: 'btn-danger', showProcess: false, id: 'btnDesactivar' },
  },
  [confirmationButtons.cancelarActivar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Reactivar', icon: fontAwesome.faSolid.check, clase: 'btn-green', showProcess: false, id: 'btnReactivar' },
  },
  [confirmationButtons.cancelarAceptar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Aceptar', icon: fontAwesome.faSolid.check, clase: 'btn-green', showProcess: false, id: 'btnAceptar' },
  },
  [confirmationButtons.cancelarCerrar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Cerrar', icon: fontAwesome.faSolid.check, clase: 'btn-green', showProcess: false, id: 'btnCerrar' },
  },
  [confirmationButtons.cancelarAnular]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Anular', icon: fontAwesome.faSolid.ban, clase: 'btn-danger', showProcess: false, id: 'btnAnular' },
  },
  [confirmationButtons.cancelarRechazar]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Rechazar', icon: fontAwesome.faSolid.ban, clase: 'btn-danger', showProcess: false, id: 'btnRechazar' },
  },
  [confirmationButtons.copiarSalir]: {
    noBtn: { label: 'Cancelar', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnCancelar' },
    siBtn: { label: 'Copiar', icon: fontAwesome.faSolid.copy, clase: 'btn-green', showProcess: false, id: 'btnCopiar' },
  },
  [confirmationButtons.cancelarNuevaCopiar]: {
    cancelarBtn: { label: 'Cancelar', icon: null, clase: 'btn-gray', showProcess: false, id: 'btnCancelar' },
    noBtn: { label: 'Comenzar nueva', icon: fontAwesome.faSolid.plus, clase: 'btn-light-grey', showProcess: false, id: 'btnNueva' },
    siBtn: { label: 'Copiar datos actuales', icon: fontAwesome.faSolid.copy, clase: 'btn-green', showProcess: false, id: 'btnCopiar' },
  },
  [confirmationButtons.continuarOSalir]: {
    noBtn: { label: 'Continuar Editando', icon: null, clase: 'btn-light-grey', showProcess: false, id: 'btnContinuarEditando' },
    siBtn: { label: 'Salir sin guardar', icon: null, clase: 'btn-danger', showProcess: false, id: 'btnConfirmSalidSinGuardar' },
  },
  [confirmationButtons.ok]: {
    siBtn: { label: 'Ok', icon: fontAwesome.faSolid.check, clase: 'btn-green', showProcess: false, id: 'btnConfirmOk' },
  },
};
