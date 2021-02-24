import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormularioMarcaModeloComponent } from './formulario-marca-modelo.component';

describe('FormularioMarcaModeloComponent', () => {
  let component: FormularioMarcaModeloComponent;
  let fixture: ComponentFixture<FormularioMarcaModeloComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormularioMarcaModeloComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormularioMarcaModeloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
