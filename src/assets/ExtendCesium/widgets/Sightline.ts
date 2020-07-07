
export class Sightline {
  private viewer: any;
  private startPoint: any;
  private endPoint: any;
  private interpolation = 10;
  private bufferDistance = 10;
  private objects: Array<any>;
  private lines: Array<any>;
  private points: Array<any>;
  constructor(
    viewer: any,
    start: any,
    end: any,
    objs: Array<any>
  ) {
    this.viewer = viewer;
    this.startPoint = start;
    this.endPoint = end;
    this.objects = objs;
    this.lines = [];
    this.points = [];
    this.sightLerp();
  }

  private drawLine(point1: any, point2: any, color: any) {
    const line: any = new Cesium.PolylineGraphics({
      positions: [point1, point2],
      material: new Cesium.ColorMaterialProperty(color),
      arcType: Cesium.ArcType.NONE,
      depthFailMaterial: new Cesium.ColorMaterialProperty(color),
      width: 2
    });
    const lineEntity = new Cesium.Entity({
      id:
        "sightline-" +
        Math.random()
          .toString(36)
          .substr(2),
      polyline: line
    });
    this.viewer.entities.add(lineEntity);
    this.lines.push(lineEntity);
  }

  private drawPoint(point: any, text: string) {
    const p: any = new Cesium.PointGraphics({
      color: Cesium.Color.BLUE,
      pixelSize: 8,
      outlineWidth: 1,
      outlineColor: Cesium.Color.WHITE
    });
    const len = text.length * 16 + 32;
    const lg: any = new Cesium.LabelGraphics({
      text: new Cesium.ConstantProperty(text),
      font: new Cesium.ConstantProperty("16px Microsoft-YaHei"),
      pixelOffset: new Cesium.Cartesian2(len / 2, -6)
    });
    const pEntity = new Cesium.Entity({
      id:
        "sightline-point-" +
        Math.random()
          .toString(36)
          .substr(2),
      point: p,
      position: point,
      label: lg
    });
    this.viewer.entities.add(pEntity);
    this.points.push(pEntity);
  }

  private cartesianToLonLatH(cartesian: any) {
    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    var lon = Cesium.Math.toDegrees(cartographic.longitude);
    var lat = Cesium.Math.toDegrees(cartographic.latitude);
    return [lon, lat, cartographic.height];
  }

  private sightLerp() {
    const startLLH = this.cartesianToLonLatH(this.startPoint);
    const endLLH = this.cartesianToLonLatH(this.endPoint);
    const distance = Cesium.Cartesian3.distance(this.startPoint, this.endPoint);
    const rayCartesian = [];
    const rayCartesian2 = [];
    for (let i = 0; i < distance; i += this.interpolation) {
      const rayHeight = Cesium.Math.lerp(startLLH[2], endLLH[2], i / distance);
      const lo1 = Cesium.Math.lerp(startLLH[0], endLLH[0], i / distance);
      const la1 = Cesium.Math.lerp(startLLH[1], endLLH[1], i / distance);
      rayCartesian.push(Cesium.Cartesian3.fromDegrees(lo1, la1, rayHeight));
      rayCartesian2.push(Cesium.Cartesian3.fromDegrees(lo1, la1, rayHeight));
    }

    (this.viewer.scene as any)
      .clampToHeightMostDetailed(rayCartesian)
      .then((clampedCartesians: any) => {
        let collisionPoint: any;

        for (let i = 0; i < rayCartesian2.length; ++i) {
          const pickHeight = this.cartesianToLonLatH(clampedCartesians[i])[2];
          const deltaHeight = this.cartesianToLonLatH(rayCartesian2[i])[2];

          const length = Cesium.Cartesian3.distance(
            this.startPoint,
            rayCartesian2[i]
          );
          if (length > this.bufferDistance) {
            if (pickHeight > deltaHeight) {
              collisionPoint = rayCartesian2[i];
              break;
            }
          }
        }
        if (collisionPoint) {
          this.drawLine(this.startPoint, collisionPoint, Cesium.Color.GREEN);
          this.drawLine(collisionPoint, this.endPoint, Cesium.Color.RED);
        } else {
          this.drawLine(this.startPoint, this.endPoint, Cesium.Color.GREEN);
        }
        this.drawPoint(this.startPoint, "观察位置");
        this.drawPoint(this.endPoint, "目标");
      });
  }

  clear() {
    this.points.forEach(p => {
      this.viewer.entities.removeById(p.id);
    });
    this.lines.forEach(l => {
      this.viewer.entities.removeById(l.id);
    });
    this.points = [];
    this.lines = [];
  }
}
