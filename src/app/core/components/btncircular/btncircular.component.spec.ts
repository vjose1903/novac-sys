import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BTNcircularComponent } from './btncircular.component';

describe('BTNcircularComponent', () => {
  let component: BTNcircularComponent;
  let fixture: ComponentFixture<BTNcircularComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BTNcircularComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BTNcircularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
