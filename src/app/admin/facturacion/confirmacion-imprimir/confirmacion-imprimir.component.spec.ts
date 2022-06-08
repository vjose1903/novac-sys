import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacionImprimirComponent } from './confirmacion-imprimir.component';

describe('ConfirmacionImprimirComponent', () => {
  let component: ConfirmacionImprimirComponent;
  let fixture: ComponentFixture<ConfirmacionImprimirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmacionImprimirComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmacionImprimirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
