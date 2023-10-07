import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'img-component',
  templateUrl: './img.component.html',
  styleUrls: ['./img.component.scss'],
})
export class ImgComponent implements OnInit {
  errorImageSrc: String;

  @Input() imgStyle?: 'circular' | 'cuadrada' = 'circular';
  @Input() imagenSrc: String;
  @Input() alt: String;

  ngOnInit(): void {
    this.errorImageSrc = this.imgStyle == 'circular' ? `assets/img/no_img_circular.png` : `assets/img/no_img_cuadrada.png`;
  }
}
