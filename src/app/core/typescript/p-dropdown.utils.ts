import { fun } from '@core/services/functions.service';

export function dropdownFilterFocusInput(drop) {
  fun.setTimeout(() => {
    const filterInput = drop?.filterViewChild?.nativeElement;
    if (filterInput) filterInput.focus();
  }, 100);
}
