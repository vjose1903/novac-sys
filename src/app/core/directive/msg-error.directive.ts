import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { FunctionService } from '../services/functions.service';
import { SingletonService } from '../services/singleton.service';

@Directive({
  selector: '[appMsgError]',
})
export class MsgErrorDirective {
  @Input('appMsgError') id;
  @Input() form: FormGroup;

  id_content;
  id_msg;
  msgContainer;

  fun = SingletonService.fun;

  constructor(private el: ElementRef) {}

  @HostListener('focusout', ['$event.target.value'])
  onBlur(value) {
    this.checkErrors(value);
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value) {
    this.fun.awaitTyping().then(() => this.checkErrors(value));
  }

  setVariables(id_content = undefined, id_msg = undefined, msgContainer = undefined) {
    this.id_content = id_content;
    this.id_msg = id_msg;
    this.msgContainer = msgContainer;
  }

  checkErrors(value) {
    const childrens = this.el.nativeElement.childNodes;
    const id_content = `msgContainer_${this.id}`;
    const id_msg = `msg_text_${this.id}`;

    const msgContainer = _.find(childrens, (child) => child.id === id_content);
    this.setVariables(id_content, id_msg, msgContainer);

    this.handleMsgError().then((msgHandle) => {
      if (msgHandle.render) {
        var msg = document.createElement('div');

        msg.setAttribute('style', 'color: #ff4d4d; margin-left: 0.2rem; position: absolute; font-size: 12px;');
        msg.id = id_msg;
        msg.innerHTML = msgHandle.msg;

        msgContainer.appendChild(msg);
        this.setVariables();
      }
    });
  }

  handleMsgError(): any {
    return new Promise((resolve) => {
      setTimeout(async () => {
        this.borrarMsgAntiguos().then(() => {
          let response = { render: false, msg: '' };

          const errors = this.form.controls[this.id].errors;

          if (!this.form.controls[this.id].valid && (this.form.controls[this.id].dirty || this.form.controls[this.id].touched)) {
            response.render = true;

            if (errors.required) response.msg = 'Este campo es requerido.';
            else if (errors.minlength) response.msg = `Cant. mínima de letras es: ${errors.minlength.requiredLength}.`;
            else if (errors.ip) response.msg = `Intoduzca una ip valida.`;
            else if (errors.compares) response.msg = `Las contraseñas no coinciden.`;
            else if (errors.invalidCedula) response.msg = `Ingrese una cedula válida.`;
          }

          resolve(response);
        });
      }, 50);
    });
  }

  borrarMsgAntiguos(firstResolve?) {
    return new Promise((resolve) => {
      firstResolve ||= resolve;

      if (this.msgContainer?.childNodes && this.msgContainer?.childNodes.length) {
        this.msgContainer.removeChild(this.msgContainer.childNodes[0]);
        this.borrarMsgAntiguos(firstResolve);
      } else {
        firstResolve(true);
      }
    });
  }
}
