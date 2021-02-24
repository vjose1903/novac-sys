import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormCantidadEfectivoComponent } from './form-cantidad-efectivo.component';

describe('FormCantidadEfectivoComponent', () => {
  let component: FormCantidadEfectivoComponent;
  let fixture: ComponentFixture<FormCantidadEfectivoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormCantidadEfectivoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCantidadEfectivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
