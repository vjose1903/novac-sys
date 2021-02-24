import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BTNACCIONESComponent } from './btnacciones.component';

describe('BTNACCIONESComponent', () => {
  let component: BTNACCIONESComponent;
  let fixture: ComponentFixture<BTNACCIONESComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BTNACCIONESComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BTNACCIONESComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
