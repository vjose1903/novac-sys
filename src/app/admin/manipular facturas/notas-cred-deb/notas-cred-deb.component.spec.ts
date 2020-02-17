import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotasCredDebComponent } from './notas-cred-deb.component';

describe('NotasCredDebComponent', () => {
  let component: NotasCredDebComponent;
  let fixture: ComponentFixture<NotasCredDebComponent>;

  beforeEach(async(() => {
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
