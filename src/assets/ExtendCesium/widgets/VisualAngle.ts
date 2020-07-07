export default class VisualAngle {

  private viewer: any;
  private scene: any;
  private camera: any;

  constructor(viewer) {
    this.viewer = viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
  }

  // 获得经纬度
  getScreenCenterLonLatPosition(screenCoord?: { x: number, y: number }) {
    const cartesian = this.getCartesian3(screenCoord);
    return this.cartesian3ToLonLat(cartesian);
  }

  // 获得视角高度
  getVisualAngleHeight() {
    return this.camera.positionCartographic.height;
  }

  // 获取方位数据
  getVisualAngleOrientation() {
    return {
      heading: this.camera.heading,
      pitch: this.camera.pitch,
      roll: this.camera.roll
    };
  }

  // 获得空间坐标
  getCartesian3(screenCoord?: { x: number, y: number }) {
    const screenRect = document.body.getBoundingClientRect();
    const x = screenCoord ? screenCoord.x : screenRect.width / 2;
    const y = screenCoord ? screenCoord.y : screenRect.height / 2;
    const cartesian = this.screenToCartesian3(x, y);
    return cartesian;
  }

  // 屏幕坐标转空间坐标
  private screenToCartesian3(x, y) {
    const pick = new Cesium.Cartesian2(x, y);
    const cartesian = this.scene.globe.pick(this.camera.getPickRay(pick), this.scene);
    return cartesian;
  }

  // 空间坐标转经纬度
  private cartesian3ToLonLat(cartesian) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lon = Cesium.Math.toDegrees(cartographic.longitude); // 经度
    const lat = Cesium.Math.toDegrees(cartographic.latitude); // 纬度
    return { lon, lat };
  }

}
