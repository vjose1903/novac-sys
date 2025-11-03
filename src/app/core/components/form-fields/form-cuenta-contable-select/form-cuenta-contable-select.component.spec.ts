import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCuentaContableSelectComponent } from './form-cuenta-contable-select.component';

describe('FormCuentaContableSelectComponent', () => {
  let component: FormCuentaContableSelectComponent;
  let fixture: ComponentFixture<FormCuentaContableSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCuentaContableSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCuentaContableSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
