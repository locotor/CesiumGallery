import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GeneMapServiceComponent } from './gene-map-service/gene-map-service.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/' },
  { path: 'gene-map-service', component: GeneMapServiceComponent }
];

@NgModule({
  declarations: [GeneMapServiceComponent],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
