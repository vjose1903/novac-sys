import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PendienteFormComponent } from './pendiente-form.component';

describe('PendienteFormComponent', () => {
  let component: PendienteFormComponent;
  let fixture: ComponentFixture<PendienteFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PendienteFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendienteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
