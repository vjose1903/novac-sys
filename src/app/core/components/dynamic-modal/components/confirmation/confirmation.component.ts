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
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  
  @Input() html: string;
  @Input() iconName: EFontAwesomeIcon | null;
  @Input() iconSize: string;
  @Input() iconColor: string;
  @Input() showReasonInput: boolean;
  @Input() reasonButtonId: string;
  @Input() onYes?: (reason?: string) => void | Promise<void>;

  reason!: string;

  ngOnInit() {
    if (this.iconName) {
      if (fun.isEmpty(this.iconSize)) this.iconSize = '40px';
      if (fun.isEmpty(this.iconColor)) this.iconColor = 'black';
    }
    if (this.showReasonInput) this.validateDeleteBtnState();
  }

  validateDeleteBtnState() {
    const buttonIsDisable = fun.isEmpty(this.reason);
    const modalWrapper = this.modalConfig.modalWrapper;

    if (modalWrapper && modalWrapper.changeStateButton) {
      modalWrapper.changeStateButton({
        modalId: this.modalConfig.id,
        btnId: this.reasonButtonId || this.modalConfig.inputs?.reasonButtonId || 'btnEliminar',
        disable: buttonIsDisable,
      });
    }
  }

  submit(arg?: any) {
    if (this.onYes) this.onYes(this.reason);
    this.modalConfig.close();
  }
}
