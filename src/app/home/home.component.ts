import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  loginForm:FormGroup
  constructor(private fb: FormBuilder,
              private router: Router 
              ) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      'usuario': null,
      'password': null
    })
    
  }

}
