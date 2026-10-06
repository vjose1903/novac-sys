import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, OnInit, Optional, Output, Self, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, NgControl } from '@angular/forms';
import { customFormsElements } from '@core/typescript/custom-forms-elements/custom-forms-elements';

type TimePeriod = 'A.M' | 'P.M';

@Component({
  selector: 'form-time-picker-input',
  templateUrl: './time-picker-input.component.html',
  styleUrl: './time-picker-input.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TimePickerInputComponent extends customFormsElements implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input() name = '';
  @Input() inputId = '';
  @Input('id') set idInput(value: string) {
    this.inputId = value;
  }
  @Input() set value(value: string | null) {
    this.setInternalValue(value, false, true);
  }
  @Input() minuteStep = 5;
  @Input() minTime?: string;
  @Input() maxTime?: string;
  @Input() isDisabled = false;
  @Input('disabled') set disabledInput(value: boolean) {
    this.isDisabled = value;
  }
  @Input() required = false;
  @Input() placeholder = 'Selecciona hora';
  @Input('readonly') isReadonly = false;
  @Input() wrapperClass = '';
  @Input() appendTo: 'self' | 'body' = 'self';

  @Output('onChange') changeEvent = new EventEmitter<string | null>();
  @Output() onChangeValue = new EventEmitter<string | null>();

  @ViewChild('triggerButton') triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('popover') popover?: ElementRef<HTMLDivElement>;

  open = false;
  selectedHour = 9;
  selectedMinute = 0;
  selectedPeriod: TimePeriod = 'A.M';
  popoverStyle: Record<string, string> = {};
  private pendingNormalizedValue: string | null = null;
  private registeredChange = false;
  private removeScrollListener?: () => void;

  constructor(
    @Optional()
    @Self()
    public override control: NgControl,
    private elementRef: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private document: Document
  ) {
    super(control);
  }

  ngOnInit(): void {
    if (this.control) {
      this.fieldName.set(`${this.control.name}`);
      this.formGroup.set(this.control['_parent']?.form || null);
    }

    this.syncPartsFromValue(this.valueSignal());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.minuteStep || changes.minTime || changes.maxTime) this.setInternalValue(this.valueSignal(), false, true);
  }

  override writeValue(value: string | null): void {
    this.setInternalValue(value, false, true);
  }

  override registerOnChange(fn: any): void {
    this.onChange = fn;
    this.registeredChange = true;
    if (this.pendingNormalizedValue !== null) {
      this.onChange(this.pendingNormalizedValue);
      this.pendingNormalizedValue = null;
    }
  }

  ngOnDestroy(): void {
    this.detachScrollListener();
    this.removePopoverFromBody();
  }

  ngAfterViewChecked(): void {
    if (this.open && this.shouldAppendToBody) this.appendPopoverToBody();
  }

  get disabledField() {
    return this.disabled() || this.isDisabled;
  }

  get fieldId() {
    return this.inputId || this.name || this.fieldName() || 'time-picker-input';
  }

  get fieldNameValue() {
    return this.name || this.fieldName();
  }

  get displayValue() {
    const value = this.valueSignal();
    return value ? this.formatDisplayValue(value) : '';
  }

  get hours() {
    return Array.from({ length: 12 }, (_, index) => index + 1);
  }

  get minutes() {
    const step = this.normalizedStep();
    const values: number[] = [];
    for (let minute = 0; minute < 60; minute += step) values.push(minute);
    return values;
  }

  get periods(): TimePeriod[] {
    return ['A.M', 'P.M'];
  }

  togglePicker(event: MouseEvent) {
    event.stopPropagation();
    if (this.disabledField || this.isReadonly) return;

    this.open = !this.open;
    if (this.open) {
      requestAnimationFrame(() => {
        this.appendPopoverToBody();
        this.positionPopover();
      });
      this.attachScrollListener();
    } else {
      this.detachScrollListener();
    }
    this.onTouched();
  }

  selectHour(hour: number) {
    this.selectedHour = hour;
    this.commitSelection();
  }

  selectMinute(minute: number) {
    this.selectedMinute = minute;
    this.commitSelection();
  }

  selectPeriod(period: TimePeriod) {
    this.selectedPeriod = period;
    this.commitSelection();
  }

  optionDisabled(hour = this.selectedHour, minute = this.selectedMinute, period = this.selectedPeriod) {
    const value = this.formatInternalValue(hour, minute, period);
    return !this.isWithinRange(value);
  }

  formatOption(value: number) {
    return `${value}`.padStart(2, '0');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.open) return;
    const target = event.target as Node;
    const host = this.elementRef.nativeElement as HTMLElement;
    const popover = this.popover?.nativeElement;
    if (host.contains(target) || popover?.contains(target)) return;
    this.closePicker();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closePicker();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  positionPopover() {
    if (!this.open || !this.triggerButton?.nativeElement) return;
    if (!this.shouldAppendToBody) return;

    const rect = this.triggerButton.nativeElement.getBoundingClientRect();
    const minWidth = 330;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - minWidth - 8));

    this.popoverStyle = {
      top: `${rect.bottom + 2}px`,
      left: `${left}px`,
      width: `${rect.width}px`,
    };
  }

  private commitSelection() {
    const nextValue = this.formatInternalValue(this.selectedHour, this.selectedMinute, this.selectedPeriod);
    if (!this.isWithinRange(nextValue)) return;
    this.setInternalValue(nextValue, true, false);
  }

  private closePicker() {
    this.open = false;
    this.detachScrollListener();
  }

  private get shouldAppendToBody() {
    return this.appendTo === 'body';
  }

  private appendPopoverToBody() {
    if (!this.shouldAppendToBody || !this.popover?.nativeElement) return;

    const popover = this.popover.nativeElement;
    if (popover.parentElement === this.document.body) return;

    this.document.body.appendChild(popover);
  }

  private removePopoverFromBody() {
    const popover = this.popover?.nativeElement;
    if (popover?.parentElement === this.document.body) this.document.body.removeChild(popover);
  }

  private setInternalValue(value: string | null, emitChange: boolean, normalizeInitial: boolean) {
    const normalized = this.normalizeValue(value);
    this.valueSignal.set(normalized);
    this.syncPartsFromValue(normalized);

    if (emitChange) {
      this.onChange(normalized);
      this.changeEvent.emit(normalized);
      this.onChangeValue.emit(normalized);
      return;
    }

    if (normalizeInitial && value && normalized !== value) {
      if (this.registeredChange) this.onChange(normalized);
      else this.pendingNormalizedValue = normalized;
    }
  }

  private attachScrollListener() {
    if (this.removeScrollListener) return;
    const handler = () => this.positionPopover();
    document.addEventListener('scroll', handler, true);
    this.removeScrollListener = () => document.removeEventListener('scroll', handler, true);
  }

  private detachScrollListener() {
    this.removeScrollListener?.();
    this.removeScrollListener = undefined;
  }

  private syncPartsFromValue(value: string | null) {
    const parsed = this.parseTimeValue(value || '09:00');
    this.selectedMinute = parsed.minute;
    this.selectedPeriod = parsed.hour >= 12 ? 'P.M' : 'A.M';
    const hour12 = parsed.hour % 12;
    this.selectedHour = hour12 === 0 ? 12 : hour12;
  }

  private normalizeValue(value: string | null): string | null {
    const parsed = this.parseTimeValue(value);
    if (!parsed) return null;

    const step = this.normalizedStep();
    const adjustedMinute = Math.floor(parsed.minute / step) * step;
    const normalized = `${this.formatOption(parsed.hour)}:${this.formatOption(adjustedMinute)}`;
    return this.clampValue(normalized);
  }

  private parseTimeValue(value: string | null) {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hour, minute] = value.split(':').map(Number);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute };
  }

  private formatDisplayValue(value: string) {
    const parsed = this.parseTimeValue(value);
    if (!parsed) return '';
    const period = parsed.hour >= 12 ? 'P.M' : 'A.M';
    const hour12 = parsed.hour % 12 || 12;
    return `${this.formatOption(hour12)}:${this.formatOption(parsed.minute)} ${period}`;
  }

  private formatInternalValue(hour12: number, minute: number, period: TimePeriod) {
    let hour = hour12 % 12;
    if (period === 'P.M') hour += 12;
    return `${this.formatOption(hour)}:${this.formatOption(minute)}`;
  }

  private normalizedStep() {
    const step = Number(this.minuteStep || 5);
    return step > 0 && step <= 60 ? step : 5;
  }

  private isWithinRange(value: string) {
    const current = this.timeToMinutes(value);
    const min = this.minTime ? this.timeToMinutes(this.normalizeRangeValue(this.minTime)) : null;
    const max = this.maxTime ? this.timeToMinutes(this.normalizeRangeValue(this.maxTime)) : null;
    if (min !== null && current < min) return false;
    if (max !== null && current > max) return false;
    return true;
  }

  private clampValue(value: string) {
    const current = this.timeToMinutes(value);
    const min = this.minTime ? this.normalizeRangeValue(this.minTime) : null;
    const max = this.maxTime ? this.normalizeRangeValue(this.maxTime) : null;
    if (min && current < this.timeToMinutes(min)) return min;
    if (max && current > this.timeToMinutes(max)) return max;
    return value;
  }

  private normalizeRangeValue(value: string) {
    const parsed = this.parseTimeValue(value);
    if (!parsed) return '00:00';
    return `${this.formatOption(parsed.hour)}:${this.formatOption(parsed.minute)}`;
  }

  private timeToMinutes(value: string) {
    const parsed = this.parseTimeValue(value);
    return parsed ? parsed.hour * 60 + parsed.minute : 0;
  }
}
