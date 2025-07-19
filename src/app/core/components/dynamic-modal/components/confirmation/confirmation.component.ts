import { Component, Input, OnInit } from '@angular/core';
import { IDynamicModal, ICallbackModal, IModalComponent, IModalConfiguration } from '../../config/dynamic-modal.interface';
import { EFontAwesomeIcon } from '@core/typescript/fontawesome';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fun } from '@core/services/functions.service';
import { DynamicModalComponent } from '../../dynamic-modal.component';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent implements OnInit, IDynamicModal {
  inputs!: {
    html: string;
    iconName: EFontAwesomeIcon | null;
    iconSize: string;
    iconColor: string;
    showReasonInput: boolean;
    callback: (data: ICallbackModal) => void;
  };

  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  reason!: string;

  ngOnInit() {
    if (this.inputs.iconName) {
      if (fun.isEmpty(this.inputs.iconSize)) this.inputs.iconSize = '40px';
      if (fun.isEmpty(this.inputs.iconColor)) this.inputs.iconColor = 'black';
    }
    if (this.inputs.showReasonInput) this.validateDeleteBtnState();
  }

  validateDeleteBtnState() {
    const buttonIsDisable = fun.isEmpty(this.reason);
    const modalWrapper = this.modalConfig.modalWrapper;
    if (modalWrapper && modalWrapper.changeStateButton) {
      modalWrapper.changeStateButton({
        modalId: this.modalConfig.id,
        btnId: 'btnEliminar',
        disable: buttonIsDisable,
      });
    }
  }

  submit(arg?: any) {
    this.inputs.callback({ data: { reason: this.reason } });
    this.modalConfig.close();
  }
}
