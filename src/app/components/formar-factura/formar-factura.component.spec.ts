import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormarFacturaComponent } from './formar-factura.component';

describe('FormarFacturaComponent', () => {
  let component: FormarFacturaComponent;
  let fixture: ComponentFixture<FormarFacturaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormarFacturaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormarFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
