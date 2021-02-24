import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReciboViajesComponent } from './recibo-viajes.component';

describe('ReciboViajesComponent', () => {
  let component: ReciboViajesComponent;
  let fixture: ComponentFixture<ReciboViajesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReciboViajesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReciboViajesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
