import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ElementRef } from '@angular/core';
import { fun } from '@core/services/functions.service';
import { Ss } from '@core/services/singleton.service';

@Directive({
  selector: '[onElementReady]',
  standalone: false,
})
export class OnElementReadyDirective implements OnInit, OnDestroy {
  @Output() elementReady = new EventEmitter<ElementRef>();
  @Input() repeatOnReappear: boolean = false;

  private hasEmitted = false;
  el = inject(ElementRef);

  ngOnInit(): void {
    if (!this.hasEmitted || this.repeatOnReappear) {
      fun.setTimeout(() => {
        this.elementReady.emit(this.el);
        this.hasEmitted = true;
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.repeatOnReappear) {
      this.hasEmitted = false;
    }
  }
}
