import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraSelectorComponent } from './mora-selector.component';

describe('MoraSelectorComponent', () => {
  let component: MoraSelectorComponent;
  let fixture: ComponentFixture<MoraSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
