import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FunctionService } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  public static fun: FunctionService;
  public static zone: NgZone;
  public static http: HttpClient;
  constructor() {}
}
