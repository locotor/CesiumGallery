import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { CesiumViewerOption } from '@shared/models/models';
import { BaseMapComponent } from '@shared/components/base-map/base-map.component';
import Layers from '@shared/utilities/cesium/Layers';
import * as Cesium from 'cesium';

@Component({
  templateUrl: './tianditu.component.html',
  styleUrls: ['./tianditu.component.less']
})
export class TiandituComponent implements AfterViewInit {

  @ViewChild('baseMap') baseMap: BaseMapComponent;

  private viewer: any;
  private scene: any;
  private camera: any;
  private viewModel: any;
  private layer: Layers;
  private imageryType: string;
  viewerOpts: CesiumViewerOption = {
    animation: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.com/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles',
        layer: 'tdtVecBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
    })
  };

  constructor() { }

  ngAfterViewInit() {
    this.initCesium();
    this.initLocation();
    this.initImagery();
    this.initLayerPicker();
  }

  initCesium() {
    this.viewer = this.baseMap.viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
    this.viewModel = this.viewer.baseLayerPicker.viewModel;
  }

  initLocation() {
    this.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(108.43130, 37.76237, 7579376)
    });
  }

  initImagery() {
    this.layer = new Layers(this.viewer);
  }

  initLayerPicker() {
    // 修改表面样式
    const boxList = this.viewer.baseLayerPicker.container.lastChild.children;
    boxList[0].innerText = '地图';
    boxList[2].innerText = '地形';
    // 地形内容重设
    this.resetTerrain();
    // 底图内容重设
    this.imageryType = location.hash.replace(/(.*)\?type=(.*)$/, '$2');
    const viewModels = this.initTianDiLayer();
    if (this.imageryType === 'terrain') {
      this.viewModel.imageryProviderViewModels = [];
      this.viewModel.terrainProviderViewModels = viewModels;
    } else {
      this.viewModel.imageryProviderViewModels = viewModels;
      this.viewModel.selectedImagery = viewModels[0];
    }
  }

  resetTerrain() {
    // 修改地形展示内容
    const terrainViewModels = [];
    terrainViewModels.push(new Cesium.ProviderViewModel({
      name: '无地形',
      iconUrl: Cesium.buildModuleUrl('../../assets/cesium/Widgets/Images/TerrainProviders/Ellipsoid.png'),
      tooltip: 'WGS84标准球体',
      creationFunction: () => new Cesium.EllipsoidTerrainProvider({})
    }));
    terrainViewModels.push(new Cesium.ProviderViewModel({
      name: '全球地形',
      iconUrl: Cesium.buildModuleUrl('../../assets/cesium/Widgets/Images/TerrainProviders/CesiumWorldTerrain.png'),
      tooltip: 'Cesium官方高分辨率全球地形',
      creationFunction: () => Cesium.createWorldTerrain({
        requestWaterMask: true,
        requestVertexNormals: true
      })
    }));
    this.viewModel.terrainProviderViewModels = terrainViewModels;
    this.viewModel.selectedTerrain = terrainViewModels[0];
  }

  initTianDiLayer() {
    document.title = '天地图服务';
    const imageryViewModels = [];
    this.layer.setTianDiToken('1dbacbfc4d4746922bebc0591e443351');
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '天地图矢量',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/tiandi_vector.png'),
      tooltip: '天地图矢量地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.TianDi.VECTOR)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '天地图影像',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/tiandi_image.png'),
      tooltip: '天地图影像地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.TianDi.IMAGE)
    }));
    return imageryViewModels;
  }
}

