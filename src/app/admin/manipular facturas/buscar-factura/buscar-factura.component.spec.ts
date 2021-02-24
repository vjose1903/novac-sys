import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BuscarFacturaComponent } from './buscar-factura.component';

describe('BuscarFacturaComponent', () => {
  let component: BuscarFacturaComponent;
  let fixture: ComponentFixture<BuscarFacturaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BuscarFacturaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
