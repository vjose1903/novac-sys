import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroSuplidoresComponent } from './registro-suplidores.component';

describe('RegistroSuplidoresComponent', () => {
  let component: RegistroSuplidoresComponent;
  let fixture: ComponentFixture<RegistroSuplidoresComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistroSuplidoresComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroSuplidoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
