import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CesiumViewerOption } from '@shared/models/models';
import * as Cesium from 'cesium';
import { CameraProperty } from '@shared/models/map/camera-property';

@Component({
  selector: 'app-base-map',
  templateUrl: './base-map.component.html',
  styleUrls: ['./base-map.component.less']
})
export class BaseMapComponent implements AfterViewInit {

  @Input() viewerOpts: CesiumViewerOption;
  @ViewChild('cesiumContainer') map: ElementRef;
  public viewer: any;
  private scene: any;
  private camera: any;
  public cameraMsg: CameraProperty = {
    lon: '',
    lat: '',
    ele: '',
    head: '',
    alt: ''
  };

  constructor() { }

  ngAfterViewInit() {
    this.initMap();
    this.bindCameraEvent();
  }

  initMap() {
    this.viewer = new Cesium.Viewer(this.map.nativeElement, this.viewerOpts);
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
  }

  bindCameraEvent() {
    const toolHandler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
    toolHandler.setInputAction(movement => {
      this.updateLonLatEvent(movement);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 更新经纬度
  updateLonLatEvent(movement) {
    const ray = this.camera.getPickRay(movement.endPosition);
    const cartesian = this.scene.globe.pick(ray, this.scene);
    if (!cartesian) { return false; }
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    this.cameraMsg.lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5); // 经度
    this.cameraMsg.lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5); // 纬度
    this.cameraMsg.ele = (cartographic.height < 0 ? 0 : cartographic.height.toFixed(1)) + '米';
    this.cameraMsg.head = Cesium.Math.toDegrees(this.camera.heading).toFixed(0) + '°';
    this.cameraMsg.alt = this.camera.positionCartographic.height.toFixed(1) + '米';
  }

}
