import { CesiumViewerOption } from '@shared/models/map/cesium';
import { BaseMapComponent } from '@shared/components/base-map/base-map.component';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import Layers from 'src/assets/ExtendCesium/widgets/Layers';
import * as Cesium from 'cesium';

@Component({
  selector: 'app-gene-map-service',
  templateUrl: './gene-map-service.component.html',
  styleUrls: ['./gene-map-service.component.less']
})
export class GeneMapServiceComponent implements OnInit, AfterViewInit {

  @ViewChild('childMap', null) childMap: BaseMapComponent;

  public viewerOpts: CesiumViewerOption = {
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

  // 不同type对应的底图init函数名
  private funcMap = {
    arcgis: 'initArcGISLayer',
    tiandi: 'initTianDiLayer',
    baidu: 'initBaiduLayer',
    mapbox: 'initMapBoxLayer',
    terrain: 'initTerrainLayer',
    wms: 'initWMSLayer',
    wmts: 'initWMTSLayer'
  };

  private viewer: any;
  private scene: any;
  private camera: any;
  private viewModel: any;

  private layer: Layers;
  private imageryType: string;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.initCesium();
    this.initLocation();
    this.initImagery();
    this.initLayerPicker();
  }

  initCesium() {
    this.viewer = this.childMap.viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
    this.viewModel = this.viewer.baseLayerPicker.viewModel;
  }

  initLocation() {
    this.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(108.43130, 37.76237, 7579376), // 27620915
    });
  }

  initImagery() {
    this.layer = new (Cesium as any).zmLayers(this.viewer);
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
    const viewModels = this[this.funcMap[this.imageryType]]();
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

  // ArcGIS
  initArcGISLayer() {
    document.title = 'ArcGIS瓦片';
    const imageryViewModels = [];
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'ArcGIS影像',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/arcgis_image.png'),
      tooltip: 'ArcGIS影像服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.ArcGIS.IMAGE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'ArcGIS社区',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/arcgis_community.png'),
      tooltip: 'ArcGIS社区地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.ArcGIS.COMMUNITY)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'ArcGIS灰度',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/arcgis_grey.png'),
      tooltip: 'ArcGIS灰度地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.ArcGIS.GREY)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'ArcGIS蓝色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/arcgis_blue.png'),
      tooltip: 'ArcGIS蓝色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.ArcGIS.BLUE)
    }));
    return imageryViewModels;
  }

  // 天地图
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
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '天地图地形',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/tiandi_terrain.png'),
      tooltip: '天地图地形地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.TianDi.TERRAIN)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '天地图全球',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/tiandi_global.png'),
      tooltip: '天地图全球地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.TianDi.GLOBAL)
    }));
    return imageryViewModels;
  }

  // 百度地图
  initBaiduLayer() {
    document.title = '百度地图';
    const imageryViewModels = [];
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度矢量',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_vector.png'),
      tooltip: '百度矢量地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.VECTOR)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度影像',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_image.png'),
      tooltip: '百度影像地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.IMAGE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度灰度',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_gray.png'),
      tooltip: '百度灰度地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.GRAY)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度午夜',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_midnight.png'),
      tooltip: '百度午夜地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.MIDNIGHT)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度黑色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_dark.png'),
      tooltip: '百度黑色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.DARK)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度警报',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_alarm.png'),
      tooltip: '百度警报地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.ALARM)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度绿色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_green.png'),
      tooltip: '百度绿色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.GREEN)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '百度蓝色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/baidu_blue.png'),
      tooltip: '百度蓝色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.Baidu.BLUE)
    }));
    return imageryViewModels;
  }

  // MapBox
  initMapBoxLayer() {
    document.title = 'MapBox';
    const imageryViewModels = [];
    this.layer.setMapBoxToken('pk.eyJ1IjoieWt4a3lreCIsImEiOiJjangxNG5xc2owMTRqNDNtejcxeXpzYjJ6In0.gqYYH7TKLpN7QbdKuHioxQ');
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox街道',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_streets.png'),
      tooltip: 'MapBox街道地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.STREETS)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox基础街道',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_streets_basic.png'),
      tooltip: 'MapBox基础街道地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.STREETS_BASIC)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox卫星',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_satellite.png'),
      tooltip: 'MapBox卫星地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.SATELLITE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox卫星街道',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_streets_satellite.png'),
      tooltip: 'MapBox卫星街道地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.STREETS_SATELLITE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox明亮',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_light.png'),
      tooltip: 'MapBox明亮地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.LIGHT)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox黑色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_dark.png'),
      tooltip: 'MapBox黑色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.DARK)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox麦色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_wheatpaste.png'),
      tooltip: 'MapBox麦色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.WHEATPASTE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox漫画',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_comic.png'),
      tooltip: 'MapBox漫画地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.COMIC)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox户外',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_outdoors.png'),
      tooltip: 'MapBox户外地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.OUTDOORS)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox远足',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_run_bike_hike.png'),
      tooltip: 'MapBox远足地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.RUN_BIKE_HIKE)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox铅色',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_pencil.png'),
      tooltip: 'MapBox铅色地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.PENCIL)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox翻印',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_pirates.png'),
      tooltip: 'MapBox翻印地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.PIRATES)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox祖母绿',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_emerald.png'),
      tooltip: 'MapBox祖母绿地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.EMERALD)
    }));
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: 'MapBox高对比度',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/mapbox_high_contrast.png'),
      tooltip: 'MapBox高对比度地图服务',
      creationFunction: () => this.layer.getImageryLayer(Layers.TYPE.MapBox.HIGH_CONTRAST)
    }));
    return imageryViewModels;
  }

  // WMS
  initWMSLayer() {
    document.title = 'WMS';
    const imageryViewModels = [];
    imageryViewModels.push(new Cesium.ProviderViewModel({
      name: '矢量图',
      iconUrl: Cesium.buildModuleUrl('../../assets/images/imagery/wms_vector.png'),
      tooltip: '由 知行宏图有限公司 提供的WMS矢量地图服务',
      creationFunction() {
        return new Cesium.WebMapServiceImageryProvider({
          // url: 'http://scjg.zxgeo.com:9999/geoserver/TJ/wms',
          url: 'http://scjg.zxgeo.com:9999/geoserver/TJ/wms',
          // layers: 'TJ:TJ_VEC',
          layers: 'TJ:TJ_VEC',
          parameters: {
            service: 'WMS',
            transparent: true, // 是否透明
            format: 'image/png'
          }
        });
      }
    }));
    return imageryViewModels;
  }

  // WMTS
  initWMTSLayer() {

  }

  // 地形服务
  initTerrainLayer() {
    document.title = '地形服务';
    this.layer.setImageryLayer(Layers.TYPE.ArcGIS.IMAGE);
    const terrainViewModels = [];
    terrainViewModels.push(new Cesium.ProviderViewModel({
      name: '无地形',
      tooltip: 'WGS84标准球体',
      iconUrl: 'assets/cesium/Widgets/Images/TerrainProviders/Ellipsoid.png',
      creationFunction: () => this.layer.getTerrainLayer(Layers.TYPE.Terrain.NO_TERRAIN)
    }));
    terrainViewModels.push(new Cesium.ProviderViewModel({
      name: '全球地形',
      tooltip: '由 Cesium官方 提供的高分辨率全球地形',
      iconUrl: 'assets/cesium/Widgets/Images/TerrainProviders/CesiumWorldTerrain.png',
      creationFunction: () => this.layer.getTerrainLayer(Layers.TYPE.Terrain.GLOBAL_TERRAIN)
    }));
    terrainViewModels.push(new Cesium.ProviderViewModel({
      name: '中国地形',
      tooltip: '由 知行宏图有限公司 提供的中国国内地形',
      iconUrl: 'assets/cesium/Widgets/Images/TerrainProviders/CesiumWorldTerrain.png',
      creationFunction: () => this.layer.getTerrainLayer(Layers.TYPE.Terrain.CHINA_TERRAIN)
    }));
    return terrainViewModels;
  }

}
