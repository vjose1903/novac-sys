import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MovimientosFormComponent } from './movimientos-form.component';

describe('MovimientosFormComponent', () => {
  let component: MovimientosFormComponent;
  let fixture: ComponentFixture<MovimientosFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MovimientosFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MovimientosFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
