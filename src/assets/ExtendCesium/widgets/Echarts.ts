import echarts from 'echarts';

export default class Echarts {

  // tslint:disable: variable-name
  private viewer: any;
  private isRegistered: any;
  private chartLayer: any;
  private option: any;
  private chartContainer: any;

  constructor(viewer, option) {
    this.viewer = viewer;
    this.isRegistered = false;
    this.chartLayer = this.createLayerContainer();
    this.option = option;
    this.chartLayer.setOption(option);
  }

  createLayerContainer() {
    const scene = this.viewer.scene;
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0px';
    container.style.left = '0px';
    container.style.right = '0px';
    container.style.bottom = '0px';
    // container.style.width = scene.canvas.width + 'px';
    // container.style.height = scene.canvas.height + 'px';
    container.style.width = scene.canvas.getBoundingClientRect().width + 'px';
    container.style.height = scene.canvas.getBoundingClientRect().height + 'px';
    container.style.pointerEvents = 'none';
    this.viewer.container.appendChild(container);
    this.chartContainer = container;
    echarts.glMap = scene;
    this.register();
    return echarts.init(container);
  }

  register() {
    if (this.isRegistered) { return; }
    // tslint:disable-next-line: no-use-before-declare
    echarts.registerCoordinateSystem('GLMap', new RegisterCoordinateSystem(echarts.glMap));
    echarts.registerAction({
      type: 'GLMapRoam',
      event: 'GLMapRoam',
      update: 'updateLayout'
      // tslint:disable-next-line: only-arrow-functions
    }, (e, t) => { });
    echarts.extendComponentModel({
      type: 'GLMap',
      // tslint:disable-next-line: object-literal-shorthand
      getBMap() {
        return this._GLMap;
      },
      defaultOption: {
        roam: !1
      }
    });
    echarts.extendComponentView({
      type: 'GLMap',
      // tslint:disable-next-line: object-literal-shorthand
      init(echartModel, api) {
        console.log('api', api);
        this.api = api, echarts.glMap.postRender.addEventListener(this.moveHandler, this);
      },
      // tslint:disable-next-line: object-literal-shorthand
      moveHandler(e, t) {
        this.api.dispatchAction({
          type: 'GLMapRoam'
        });
      },
      // tslint:disable-next-line: object-literal-shorthand
      render(e, t, i) { },
      // tslint:disable-next-line: object-literal-shorthand
      dispose() {
        echarts.glMap.postRender.removeEventListener(this.moveHandler, this);
      }
    });
    this.isRegistered = true;
  }

  dispose() {
    // tslint:disable-next-line: no-unused-expression
    this.chartContainer && (this.viewer.container.removeChild(this.chartContainer), this.chartContainer = null);
    // tslint:disable-next-line: no-unused-expression
    this.chartLayer && (this.chartLayer.dispose(), this.chartLayer = null);
    this.isRegistered = false;
  }

  destroy() {
    this.dispose();
  }

  updateEchartsLayer(option?) {
    option = option ? option : this.option;
    // tslint:disable-next-line: no-unused-expression
    this.chartLayer && this.chartLayer.setOption(option);
    this.chartContainer.style.width = this.viewer.scene.canvas.getBoundingClientRect().width + 'px';
    this.chartContainer.style.height = this.viewer.scene.canvas.getBoundingClientRect().height + 'px';
    this.chartLayer.resize();
  }

  getMap() {
    return this.viewer;
  }

  getEchartsLayer() {
    return this.chartLayer;
  }

  show() {
    // tslint:disable-next-line: no-unused-expression
    this.chartContainer && (this.chartContainer.style.visibility = 'visible');
  }

  hide() {
    // tslint:disable-next-line: no-unused-expression
    this.chartContainer && (this.chartContainer.style.visibility = 'hidden');
  }

}

class RegisterCoordinateSystem {

  private dimensions = ['lng', 'lat'];
  private radians = Cesium.Math.toRadians(80);
  // tslint:disable: variable-name
  private GLMap: any;
  private mapOffset: any;
  private bmap: any;
  private api: any;

  constructor(glMap, api?: any) {
    this.GLMap = glMap;
    this.mapOffset = [0, 0];
    this.dimensions = ['lng', 'lat'];
    this.api = api || null;
  }

  setMapOffset(mapOffset) {
    this.mapOffset = mapOffset;
  }

  getMap() {
    return this.GLMap;
  }

  fixLat(lat) {
    return lat >= 90 ? 89.99999999999999 : lat <= -90 ? -89.99999999999999 : lat;
  }

  dataToPoint(coords) {
    const lonLat = [99999, 99999];
    coords[1] = this.fixLat(coords[1]);
    const position = Cesium.Cartesian3.fromDegrees(coords[0], coords[1]);
    if (!position) { return lonLat; }
    const coordinates = this.GLMap.cartesianToCanvasCoordinates(position);
    if (!coordinates) { return lonLat; }
    // // 注释掉会导致视角转移到地球背面时，无法隐藏echarts里的内容
    // if (this.GLMap.mode === Cesium.SceneMode.SCENE3D) {
    //   if (Cesium.Cartesian3.angleBetween(this.GLMap.camera.position, position) > this.radians) { return !1; }
    // }
    return [coordinates.x - this.mapOffset[0], coordinates.y - this.mapOffset[1]];
  }

  pointToData(pixel) {
    const mapOffset = this.mapOffset;
    const coords = this.bmap.project([pixel[0] + pixel[0], pixel[1] + pixel[1]]);
    return [coords.lng, coords.lat];
  }

  getViewRect() {
    const api = this.api;
    return new echarts.graphic.BoundingRect(0, 0, api.getWidth(), api.getHeight());
  }

  getRoamTransform() {
    return echarts.matrix.create();
  }

  create(echartModel, api) {
    console.log('create', api);
    this.api = api;
    let registerCoordinateSystem;
    echartModel.eachComponent('GLMap', seriesModel => {
      const painter = api.getZr().painter;
      if (painter) {
        // let glMap = (api.getViewportRoot(), echarts.glMap);
        const glMap = echarts.glMap;
        registerCoordinateSystem = new RegisterCoordinateSystem(glMap, api);
        registerCoordinateSystem.setMapOffset(seriesModel.__mapOffset || [0, 0]);
        seriesModel.coordinateSystem = registerCoordinateSystem;
      }
    });

    echartModel.eachSeries(series => {
      // tslint:disable-next-line: no-unused-expression
      'GLMap' === series.get('coordinateSystem') && (series.coordinateSystem = registerCoordinateSystem);
    });
  }

}
