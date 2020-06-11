import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturasAdelantadasComponent } from './facturas-adelantadas.component';

describe('FacturasAdelantadasComponent', () => {
  let component: FacturasAdelantadasComponent;
  let fixture: ComponentFixture<FacturasAdelantadasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacturasAdelantadasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacturasAdelantadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
