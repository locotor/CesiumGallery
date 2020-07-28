import { Component, AfterViewInit } from '@angular/core';
import * as Cesium from 'cesium';

@Component({
  templateUrl: './tianditu.component.html',
  styleUrls: ['./tianditu.component.less']
})
export class TiandituComponent implements AfterViewInit {

  viewerOpts = {
    animation: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    }),
  };

  constructor() { }

  ngAfterViewInit(): void {
  }

}
