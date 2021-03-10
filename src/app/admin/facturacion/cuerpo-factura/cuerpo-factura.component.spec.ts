import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CuerpoFacturaComponent } from './cuerpo-factura.component';

describe('CuerpoFacturaComponent', () => {
  let component: CuerpoFacturaComponent;
  let fixture: ComponentFixture<CuerpoFacturaComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CuerpoFacturaComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CuerpoFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
