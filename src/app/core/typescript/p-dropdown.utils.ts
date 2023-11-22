export function dropdownFilterFocusInput(drop) {
  setTimeout(() => {
    const filterInput = drop?.filterViewChild?.nativeElement;
    if (filterInput) filterInput.focus();
  }, 25);
}
