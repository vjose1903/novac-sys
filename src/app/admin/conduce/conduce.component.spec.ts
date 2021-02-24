import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConduceComponent } from './conduce.component';

describe('ConduceComponent', () => {
  let component: ConduceComponent;
  let fixture: ComponentFixture<ConduceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConduceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConduceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
