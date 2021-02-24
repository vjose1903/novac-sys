import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RegistroArticulosComponent } from './registro-articulos.component';



describe('RegistroArticulosComponent', () => {
  let component: RegistroArticulosComponent;
  let fixture: ComponentFixture<RegistroArticulosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistroArticulosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroArticulosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
