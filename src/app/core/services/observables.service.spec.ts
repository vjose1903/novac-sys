import { TestBed } from '@angular/core/testing';

import { ObservableServcie } from './observables.service';

describe('ObservableServcie', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ObservableServcie = TestBed.get(ObservableServcie);
    expect(service).toBeTruthy();
  });
});
