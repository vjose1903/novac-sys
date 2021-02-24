import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RegistroClientesComponent } from './registro-clientes.component';

describe('RegistroClientesComponent', () => {
  let component: RegistroClientesComponent;
  let fixture: ComponentFixture<RegistroClientesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistroClientesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
