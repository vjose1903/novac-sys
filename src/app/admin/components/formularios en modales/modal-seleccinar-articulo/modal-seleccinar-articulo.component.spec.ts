import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalSeleccinarArticuloComponent } from './modal-seleccinar-articulo.component';

describe('ModalSeleccinarArticuloComponent', () => {
  let component: ModalSeleccinarArticuloComponent;
  let fixture: ComponentFixture<ModalSeleccinarArticuloComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalSeleccinarArticuloComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalSeleccinarArticuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
