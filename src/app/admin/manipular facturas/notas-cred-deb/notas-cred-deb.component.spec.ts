import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotasCredDebComponent } from './notas-cred-deb.component';

describe('NotasCredDebComponent', () => {
  let component: NotasCredDebComponent;
  let fixture: ComponentFixture<NotasCredDebComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotasCredDebComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotasCredDebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
