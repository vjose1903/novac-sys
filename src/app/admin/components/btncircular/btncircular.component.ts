import { Component, OnInit, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-btncircular',
  templateUrl: './btncircular.component.html',
  styleUrls: ['./btncircular.component.scss'],
})
export class BTNcircularComponent implements OnInit, AfterViewInit {
  @Input() nombreImg;
  @Input() accion;
  @Input() alto;
  @Input() ancho;
  @Input() disabled = false;

  @Output() pulsar = new EventEmitter<any>();
  element: HTMLElement;
  constructor() {}

  ngOnInit() {}
  ngAfterViewInit(): void {
    this.element = document.getElementById('btn-' + this.accion) as HTMLElement;
    this.element.style.height = this.alto;
  }

  click() {
    if (!this.disabled) this.pulsar.emit();
  }
}
