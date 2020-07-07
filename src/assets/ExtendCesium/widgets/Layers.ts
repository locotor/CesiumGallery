import BaiduImageryProvider from './Imagery/provider/BaiduImageryProvider';

class ArcGIS {
  public static readonly IMAGE = Symbol('IMAGE');
  public static readonly GREY = Symbol('GREY');
  public static readonly BLUE = Symbol('BLUE');
  public static readonly COMMUNITY = Symbol('COMMUNITY');
}

class TianDi {
  public static readonly IMAGE = Symbol('IMAGE');
  public static readonly VECTOR = Symbol('VECTOR');
  public static readonly TERRAIN = Symbol('TERRAIN');
  public static readonly GLOBAL = Symbol('GLOBAL');
}

class Baidu {
  public static readonly VECTOR = Symbol('VECTOR');
  public static readonly IMAGE = Symbol('IMAGE');
  public static readonly GRAY = Symbol('GRAY');
  public static readonly MIDNIGHT = Symbol('MIDNIGHT');
  public static readonly DARK = Symbol('DARK');
  public static readonly ALARM = Symbol('ALARM');
  public static readonly GREEN = Symbol('GREEN');
  public static readonly BLUE = Symbol('BLUE');
}

class MapBox {
  public static readonly STREETS = Symbol('STREETS');
  public static readonly STREETS_BASIC = Symbol('STREETS_BASIC');
  public static readonly SATELLITE = Symbol('SATELLITE');
  public static readonly STREETS_SATELLITE = Symbol('STREETS_SATELLITE');
  public static readonly LIGHT = Symbol('LIGHT');
  public static readonly DARK = Symbol('DARK');
  public static readonly WHEATPASTE = Symbol('WHEATPASTE');
  public static readonly COMIC = Symbol('COMIC');
  public static readonly OUTDOORS = Symbol('OUTDOORS');
  public static readonly RUN_BIKE_HIKE = Symbol('RUN_BIKE_HIKE');
  public static readonly PENCIL = Symbol('PENCIL');
  public static readonly PIRATES = Symbol('PIRATES');
  public static readonly EMERALD = Symbol('EMERALD');
  public static readonly HIGH_CONTRAST = Symbol('HIGH_CONTRAST');
}

class Terrain {
  public static readonly NO_TERRAIN = Symbol('NO_TERRAIN');
  public static readonly GLOBAL_TERRAIN = Symbol('GLOBAL_TERRAIN');
  public static readonly CHINA_TERRAIN = Symbol('CHINA_TERRAIN');
}

export default class Layers {

  public static readonly TYPE = {
    ArcGIS,
    TianDi,
    Baidu,
    MapBox,
    Terrain
  };

  private mapBoxToken = '';
  private tianDiToken = '';

  private readonly imageries = {
    // ArcGIS
    [ArcGIS.IMAGE]: [new Cesium.ArcGisMapServerImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    })],
    [ArcGIS.COMMUNITY]: [new Cesium.ArcGisMapServerImageryProvider({
      url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer'
    })],
    [ArcGIS.GREY]: [new Cesium.ArcGisMapServerImageryProvider({
      url: 'http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer',
    })],
    [ArcGIS.BLUE]: [new Cesium.ArcGisMapServerImageryProvider({
      url: 'https://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer',
    })],
    // 天地图
    [TianDi.VECTOR]: null,
    [TianDi.IMAGE]: null,
    [TianDi.TERRAIN]: null,
    [TianDi.GLOBAL]: null,
    // 百度 // custom可选值：dark, midnight, grayscale, hardedge, light, redalert, grassgreen, pink, darkgreen, bluish
    [Baidu.VECTOR]: [new BaiduImageryProvider({
      style: 'vector',
    })],
    [Baidu.IMAGE]: [new BaiduImageryProvider({
      style: 'image',
    })],
    [Baidu.GRAY]: [new BaiduImageryProvider({
      style: 'grayscale'
    })],
    [Baidu.MIDNIGHT]: [new BaiduImageryProvider({
      style: 'midnight'
    })],
    [Baidu.DARK]: [new BaiduImageryProvider({
      style: 'dark'
    })],
    [Baidu.ALARM]: [new BaiduImageryProvider({
      style: 'redalert'
    })],
    [Baidu.GREEN]: [new BaiduImageryProvider({
      style: 'grassgreen'
    })],
    [Baidu.BLUE]: [new BaiduImageryProvider({
      style: 'bluish'
    })],
    // MapBox 需要token才能加载
    [MapBox.STREETS]: null,
    [MapBox.STREETS_BASIC]: null,
    [MapBox.SATELLITE]: null,
    [MapBox.STREETS_SATELLITE]: null,
    [MapBox.LIGHT]: null,
    [MapBox.DARK]: null,
    [MapBox.WHEATPASTE]: null,
    [MapBox.COMIC]: null,
    [MapBox.OUTDOORS]: null,
    [MapBox.RUN_BIKE_HIKE]: null,
    [MapBox.PENCIL]: null,
    [MapBox.PIRATES]: null,
    [MapBox.EMERALD]: null,
    [MapBox.HIGH_CONTRAST]: null,
  };
  private readonly terrains = {
    // Terrain
    [Terrain.NO_TERRAIN]: new Cesium.EllipsoidTerrainProvider({
      ellipsoid: Cesium.Ellipsoid.WGS84
    }),
    [Terrain.GLOBAL_TERRAIN]: new Cesium.CesiumTerrainProvider({
      url: Cesium.IonResource.fromAssetId(1),
      requestWaterMask: !0,
      requestVertexNormals: !0
    }),
    [Terrain.CHINA_TERRAIN]: new Cesium.CesiumTerrainProvider({
      url: 'http://localhost:8080/terrain', // 'http://192.168.11.181:8080/terrain',
      requestWaterMask: !0,
      requestVertexNormals: !0
    })
  };

  private viewer: any;

  private imageryType = null;
  private terrainType = null;

  constructor(viewer) {
    this.viewer = viewer;
  }

  setImageryLayer(type: symbol) {
    this.viewer.imageryLayers.removeAll();
    this.imageryType = type;
    const imageryLayers = this.imageries[type];
    this.checkToken(type);
    imageryLayers.forEach(layer => {
      this.viewer.imageryLayers.addImageryProvider(layer);
    });
    return imageryLayers;
  }

  getImageryLayer(type: symbol) {
    return this.imageries[type];
  }

  setTerrainLayer(type: symbol) {
    this.terrainType = type;
    const terrainLayer = this.terrains[type];
    this.viewer.terrainProvider = terrainLayer;
    return terrainLayer;
  }

  getTerrainLayer(type: symbol) {
    return this.terrains[type];
  }

  // TODO: 针对一些需要添加key值或者token的底图服务
  checkToken(type) {
  }

  // 设置天地图的token
  setTianDiToken(token) {
    this.tianDiToken = token;
    this.imageries[TianDi.VECTOR] = [new Cesium.WebMapTileServiceImageryProvider({
      // tslint:disable: max-line-length
      url: 'http://t0.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtVecBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    }), new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtCvaBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    })];
    this.imageries[TianDi.IMAGE] = [new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtVImgBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    }), new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtVCiaBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    })];
    this.imageries[TianDi.TERRAIN] = [new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/ter_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=ter&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtTerBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    }), new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/cta_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cta&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtCtaBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    })];
    this.imageries[TianDi.GLOBAL] = [new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://t0.tianditu.gov.cn/ibo_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=ibo&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=' + this.tianDiToken,
      layer: 'tdtIboBasicLayer',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: 'GoogleMapsCompatible',
      show: true
    })];
  }

  // 设置mapBox的token
  setMapBoxToken(token) {
    // tslint:disable-next-line: max-line-length
    // mapbox可选值 mapbox.satellite, mapbox.streets, mapbox.light, mapbox.dark, mapbox.streets-satellite, mapbox.wheatpaste, mapbox.streets-basic, mapbox.comic, mapbox.outdoors, mapbox.run-bike-hike, mapbox.pencil, mapbox.pirates, mapbox.emerald, mapbox.high-contrast
    this.mapBoxToken = token;
    this.imageries[MapBox.STREETS] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.streets',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.STREETS_BASIC] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.streets-basic',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.SATELLITE] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.satellite',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.STREETS_SATELLITE] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.streets-satellite',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.LIGHT] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.light',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.DARK] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.dark',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.WHEATPASTE] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.wheatpaste',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.COMIC] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.comic',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.OUTDOORS] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.outdoors',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.RUN_BIKE_HIKE] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.run-bike-hike',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.PENCIL] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.pencil',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.PIRATES] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.pirates',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.EMERALD] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.emerald',
      accessToken: this.mapBoxToken
    })];
    this.imageries[MapBox.HIGH_CONTRAST] = [new Cesium.MapboxImageryProvider({
      mapId: 'mapbox.high-contrast',
      accessToken: this.mapBoxToken
    })];
  }

}
