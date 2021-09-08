import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsgErrorPipe } from './msg-error.pipe';
import { FiltroParaNgforPipe } from './filtro-para-ngfor.pipe';

const pipes = [FiltroParaNgforPipe, MsgErrorPipe];
@NgModule({
  declarations: pipes,
  imports: [CommonModule],
  exports: pipes,
})
export class PipesModule {}
