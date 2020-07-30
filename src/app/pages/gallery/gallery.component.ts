import { Component, OnInit } from '@angular/core';
import { demoData } from './gallery-data';

@Component({
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.less']
})
export class GalleryComponent implements OnInit {

  isCollapsed = false;
  demosData = demoData;

  constructor() { }

  ngOnInit(): void {
  }

}
