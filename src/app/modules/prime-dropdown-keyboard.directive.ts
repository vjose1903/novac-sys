import { Directive, OnInit, Optional } from '@angular/core';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';

/** Keeps pointer hover from changing the option selected by keyboard. */
@Directive({
  selector: 'p-select, p-multiselect',
  standalone: false,
})
export class PrimeDropdownKeyboardDirective implements OnInit {
  constructor(
    @Optional() private readonly select: Select | null,
    @Optional() private readonly multiSelect: MultiSelect | null,
  ) {}

  ngOnInit(): void {
    if (this.select) this.select.focusOnHover = false;
    if (this.multiSelect) this.multiSelect.focusOnHover = false;
  }
}
