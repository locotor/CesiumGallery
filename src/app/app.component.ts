import { Component } from '@angular/core';
import { demoData } from './gallery-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  isCollapsed = false;
  demosData = demoData;
}
