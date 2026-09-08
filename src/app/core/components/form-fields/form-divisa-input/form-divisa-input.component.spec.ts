import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDivisaInputComponent } from './form-divisa-input.component';

describe('FormDivisaInputComponent', () => {
  let component: FormDivisaInputComponent;
  let fixture: ComponentFixture<FormDivisaInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDivisaInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDivisaInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
