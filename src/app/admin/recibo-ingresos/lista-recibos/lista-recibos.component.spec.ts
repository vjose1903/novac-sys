import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaRecibosComponent } from './lista-recibos.component';

describe('ListaRecibosComponent', () => {
  let component: ListaRecibosComponent;
  let fixture: ComponentFixture<ListaRecibosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListaRecibosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaRecibosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
