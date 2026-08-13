import { Ss } from '@services/singleton.service';
import { IButtonDynamic, ICallbackModal, IDynamicModal, IModalComponent, IModalConfiguration } from './dynamic-modal.interface';
import { fun } from '@services/functions.service';
import { DynamicModalComponent } from '../dynamic-modal.component';

export class DynamicModalClass {
  id: string | undefined;
  visible: boolean = false;
  header: string | undefined;
  inputs: any;
  component: any;
  componentInstance!: IDynamicModal;
  width: string | undefined;
  height: string | undefined;
  baseZIndex: number | undefined;
  padding: string | undefined;
  overflow: 'hidden' | 'auto' | undefined;
  private _botones: Array<IButtonDynamic>;
  resizable: boolean | undefined;
  html: string | undefined;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | undefined;
  transitionOptions: string | undefined;
  contentStyleClass: string | undefined;
  styleClass: string | undefined;
  maximizable: boolean | undefined;
  closable: boolean | undefined;
  closableEsc: boolean | undefined;
  closableClickOutside: boolean | undefined;
  confirmToClose: boolean | undefined;
  disableAllButtonsIfAnyProcessing: boolean | undefined;
  focusOnShow: boolean | undefined;
  secondDetectChanges: boolean | undefined;

  returnData!: Function;
  hideModal!: Function;
  // [prop: string]: any;

  private callback: Function | null = null;
  modalWrapper!: DynamicModalComponent;

  public set botones(botones: Array<IButtonDynamic>) {
    this._botones = this.handleBotonesConfig(botones);
  }

  public get botones(): Array<IButtonDynamic> {
    return this._botones;
  }

  constructor(params?: IModalConfiguration) {
    this.id = params?.id;
    this.component = params && fun.objHas(params, 'component') ? params.component : undefined;
    this.width = params && fun.objHas(params, 'width') ? params.width : '50vw';
    this.height = params && fun.objHas(params, 'height') ? params.height : undefined;
    this.baseZIndex = params && fun.objHas(params, 'baseZIndex') ? params.baseZIndex : 10000;
    this.padding = params && fun.objHas(params, 'padding') ? params.padding : '1rem';
    this.overflow = params && fun.objHas(params, 'overflow') ? params.overflow : 'hidden';
    this.inputs = params && fun.objHas(params, 'inputs') ? params.inputs : undefined;
    this.header = params && fun.objHas(params, 'header') ? params.header : undefined;
    this.position = params && fun.objHas(params, 'position') ? params.position : 'center';
    this._botones = params && fun.objHas(params, 'botones') && params.botones ? this.handleBotonesConfig(params.botones) : [];
    this.resizable = params && fun.objHas(params, 'resizable') ? params.resizable : false;
    this.transitionOptions = params && fun.objHas(params, 'transitionOptions') ? params.transitionOptions : '100ms';
    this.contentStyleClass = params && fun.objHas(params, 'contentStyleClass') ? params.contentStyleClass : '';
    this.styleClass = params && fun.objHas(params, 'styleClass') ? params.styleClass : '';
    this.closable = params && fun.objHas(params, 'closable') ? params.closable : true;
    this.closableEsc = params && fun.objHas(params, 'closableEsc') ? params.closableEsc : false;
    this.maximizable = params && fun.objHas(params, 'maximizable') ? params.maximizable : false;
    this.closableClickOutside = params && fun.objHas(params, 'closableClickOutside') ? params.closableClickOutside : false;
    this.confirmToClose = params && fun.objHas(params, 'confirmToClose') ? params.confirmToClose : false;
    this.html = params && fun.objHas(params, 'html') ? params.html : undefined;
    this.callback = params && fun.objHas(params, 'callback') ? params.callback : undefined;
    this.disableAllButtonsIfAnyProcessing = params && fun.objHas(params, 'disableAllButtonsIfAnyProcessing') ? params.disableAllButtonsIfAnyProcessing : false;
    this.focusOnShow = params && fun.objHas(params, 'focusOnShow') ? params.focusOnShow : true;
    this.secondDetectChanges = params && fun.objHas(params, 'secondDetectChanges') ? params.secondDetectChanges : true;

    this.returnData = (arg: ICallbackModal) => this.runCallback(arg);
    this.hideModal = (arg: ICallbackModal) => this.runCallback(arg);


  }

  show() {
    queueMicrotask(() => {
      this.visible = true;
      Ss.dynamicModalService.updateModalConfig(this);
    });
  }

  close(dataToReturn?: ICallbackModal) {
    this.modalWrapper.handleCloseModal(this.id, dataToReturn);
  }

  setCallback(callback: Function) {
    this.callback = callback;
  }

  // PRIVATE ------------------------------------------------------------------------------------------

  private runCallback(arg: ICallbackModal) {
    if (this.callback) this.callback(arg);
  }

  private handleBotonesConfig(botones: Array<IButtonDynamic>): Array<IButtonDynamic> {
    if (botones && botones.length > 0) {
      botones.map(boton => {
        if (fun.isEmpty(boton.functionInOtherComponent) && fun.isEmpty(boton.function) && fun.isEmpty(boton.action)) {
          boton.functionInOtherComponent = 'submit';
        }

        return boton;
      });
    }

    return botones;
  }
}
