import { CommonModule } from '@angular/common';
import { Ss } from './../../../core/services/singleton.service';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'svg-background',
  imports: [CommonModule],
  templateUrl: './svg-background.component.html',
  styleUrls: ['./svg-background.component.scss'],
})
export class SvgBackgroundComponent implements AfterViewInit {
  @ViewChild('svgContainer', { static: true }) svgContainer: ElementRef;

  initComponent: boolean = false;

  constructor() {}

  ngAfterViewInit(): void {
    this.initComponent = true;
    Ss.cdRef.detectChanges();
  }

  getSvgSize(prop: 'offsetWidth' | 'offsetHeight') {
    return `${this.svgContainer[prop]}px`;
  }

  getduration(number = 0) {
    const base = 5;
    return `${base + number}s`;
  }
}
