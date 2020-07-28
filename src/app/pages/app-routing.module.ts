import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TiandituComponent } from './tianditu/tianditu.component';
import { GalleryComponent } from './gallery/gallery.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/gallery' },
  { path: 'gallery', component: GalleryComponent },
  { path: 'tianditu', component: TiandituComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
