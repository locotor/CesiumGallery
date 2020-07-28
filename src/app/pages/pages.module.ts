import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { TiandituComponent } from './tianditu/tianditu.component';
import { GalleryComponent } from './gallery/gallery.component';


@NgModule({
  declarations: [
    TiandituComponent,
    GalleryComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class PagesModule { }
