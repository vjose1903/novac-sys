import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalHistorialPagosComponent } from './modal-historial-pagos.component';

describe('ModalHistorialPagosComponent', () => {
  let component: ModalHistorialPagosComponent;
  let fixture: ComponentFixture<ModalHistorialPagosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalHistorialPagosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalHistorialPagosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
