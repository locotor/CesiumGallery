import { PickPoint, PickPointOptions } from "./PickPoint";

import * as turf from "@turf/turf";
import { Subject } from "rxjs";

export class BackFill extends PickPoint {
  private boundWall: any;
  private terrainProvider: any;
  private globe: any;

  private segs = 8;
  private defaultPrecision = 0.01;
  private precision = 0.01; //切分精度
  private im: PointInfo[][]; //插值信息
  private targetHeight: number; // 填充高度;
  private boundPolygon: any[];
  private fillEntity: any;
  private mOrigin: { x: number; y: number };

  get origin() {
    return this.mOrigin;
  }
  get tHeight() {
    return this.targetHeight;
  }

  get bPolygon(){
    return this.boundPolygon;
  }

  public bfInfo: Subject<{
    target: number;
    area: number;
    fvolume: number;
    evolume: number;
  }>;

  constructor(options: BackFillOptions) {
    super(options);
    this.bfInfo = new Subject();
    this.globe = this.viewer.scene.globe;
    this.globe.depthTestAgainstTerrain = true;
    this.terrainProvider = options.terrainProvider;
    this.viewer.terrainProvider = this.terrainProvider;
  }

  public startPick() {
    this.im = [];
    this.boundPolygon = [];
    this.clear();
    this.targetHeight = 0;
    const pob = super.startPick();
    pob.subscribe(pInfo => {
      if (pInfo.opt === "end" && pInfo.points.length >= 3) {
        this.clear();
        this.handleFill(pInfo.points);
      }
    });
    return pob;
  }

  public setTargetHeight(height: number) {
    if (this.im && this.im.length) {
      this.targetHeight = height;
      let res = this.calcVolume(this.targetHeight);
      this.bfInfo.next({
        target: this.targetHeight,
        ...res
      });
      this.fillPolygon();
    }
  }

  private handleFill(points: any[]) {
    this.boundPolygon = points;
    this.createWall(points); // 创建边界墙
    this.interpolationMatrix(points).then(im => {
      this.im = im;
      if (this.im && this.targetHeight) {
        let res = this.calcVolume(this.targetHeight);
        this.bfInfo.next({
          target: this.targetHeight,
          ...res
        });
      }
    }); // 细分选中区域
  }

  public deepestPoint() {
    let dp = null;
    if (this.im && this.im.length) {
      for (let row = 0; row < this.im.length; row++) {
        for (let col = 0; col < this.im[0].length; col++) {
          if (
            this.im[row][col] &&
            (dp == null || dp > this.im[row][col].height)
          ) {
            dp = this.im[row][col].height;
          }
        }
      }

    }
    return dp;
  }

  public calcVolume(height: number) {
    const rl = this.im.length;
    const cl = this.im[0].length;
    let fvolume = 0;
    let area = 0;
    let evolume = 0;
    for (let row = 1; row < rl - 1; row++) {
      for (let col = 0; col < cl - 1; col++) {
        if (this.im[row][col] && this.im[row][col + 1]) {
          if (this.im[row - 1][col]) {
            let res = this.prismVolume(
              this.im[row - 1][col],
              this.im[row][col],
              this.im[row][col + 1],
              height
            );
            area += res.area;
            fvolume += res.fillVolume;
            evolume += res.excavationVolume;
          }
          if (this.im[row + 1][col + 1]) {
            let res = this.prismVolume(
              this.im[row][col],
              this.im[row][col + 1],
              this.im[row + 1][col + 1],
              height
            );
            area += res.area;
            fvolume += res.fillVolume;
            evolume += res.excavationVolume;
          }
        }
      }
    }
    return { area, fvolume, evolume };
  }

  // 计算直角三角锥体积\面积，p2为直角点
  private prismVolume(
    p1: PointInfo,
    p2: PointInfo,
    p3: PointInfo,
    height: number
  ): { area: number; fillVolume: number; excavationVolume: number } {
    let area = 0;
    let fillVolume = 0;
    let excavationVolume = 0;
    const averageHeight = (p1.height + p2.height + p3.height) / 3;
    const point1 = Cesium.Cartesian3.fromDegrees(p1.x, p1.y, averageHeight);
    const point2 = Cesium.Cartesian3.fromDegrees(p2.x, p2.y, averageHeight);
    const point3 = Cesium.Cartesian3.fromDegrees(p3.x, p3.y, averageHeight);
    const dis1 = Cesium.Cartesian3.distance(point1, point2);
    const dis2 = Cesium.Cartesian3.distance(point2, point3);
    area = (dis1 * dis2) / 2;
    if (averageHeight > height) {
      const altitudeDifference = averageHeight - this.targetHeight;
      excavationVolume = area * altitudeDifference;
    } else {
      const ald = this.targetHeight - averageHeight;
      fillVolume = area * ald;
    }
    return {
      area,
      fillVolume,
      excavationVolume
    };
  }

  private createWall(points: any[]) {
    this.maxAndminHeight(points).then(({ max, uPoints }) => {
      const hierarchy = this.wallPolygonHierarchy(uPoints);
      this.targetHeight = max;
      const pg = new Cesium.PolygonGraphics({
        hierarchy,
        height: 0,
        extrudedHeight: max,
        shadows: Cesium.ShadowMode.ENABLED,
        material: Cesium.Color.BLUE.withAlpha(0.5)
      });
      const wallentity = new Cesium.Entity({
        polygon: pg
      });
      this.boundWall = this.viewer.entities.add(wallentity);
    });
  }

  private fillPolygon() {
    if (this.fillEntity) {
      this.viewer.entities.removeById(this.fillEntity.id);
      this.fillEntity = null;
    }
    const hierarchy = new Cesium.PolygonHierarchy(this.boundPolygon);
    const fpg = new Cesium.PolygonGraphics({
      hierarchy,
      height: 0,
      extrudedHeight: this.targetHeight as any,
      material: Cesium.Color.GREEN.withAlpha(0.3)
    });
    const fillentity = new Cesium.Entity({
      polygon: fpg
    });
    this.fillEntity = this.viewer.entities.add(fillentity);
  }

  private clear() {
    if (this.boundWall) {
      this.viewer.entities.removeById(this.boundWall.id);
    }
    if (this.fillEntity) {
      this.viewer.entities.removeById(this.boundWall.id);
    }
    this.boundWall = null;
    this.fillEntity = null;
  }

  private async interpolationMatrix(points: any[]) {
    const positions = points.map(point => {
      const p = Cesium.Cartographic.fromCartesian(point);
      return [
        Cesium.Math.toDegrees(p.longitude),
        Cesium.Math.toDegrees(p.latitude)
      ];
    });
    positions.push(positions[0]);
    const polygon = turf.polygon([positions]);
    const bounds = turf.bbox(polygon);
    const promiseArr = [];
    const im = [];
    this.calcPrecision(bounds[2] - bounds[0], bounds[3] - bounds[1]);
    for (let lng = bounds[0]; lng <= bounds[2]; lng += this.precision) {
      const ir = [];
      for (let lat = bounds[1]; lat <= bounds[3]; lat += this.precision) {
        const point = turf.point([lng, lat]);
        if (turf.booleanPointInPolygon(point, polygon)) {
          const infinitesimal = {
            x: lng,
            y: lat,
            height: 0
          };
          promiseArr.push(
            new Promise(resolve => {
              var promise = Cesium.sampleTerrainMostDetailed(
                this.terrainProvider,
                [Cesium.Cartographic.fromDegrees(lng, lat)]
              );
              Cesium.when(promise, (updatedPositions: Array<any>) => {
                infinitesimal.height = updatedPositions[0].height;
                resolve();
              });
            })
          );
          ir.push(infinitesimal);
        } else {
          ir.push(false);
        }
      }
      im.push(ir);
    }

    await Promise.all(promiseArr);
    return im;
  }

  private calcPrecision(diffx: number, diffy: number) {
    this.precision = this.defaultPrecision;
    if (diffx / this.segs < this.precision) {
      this.precision = diffx / this.segs;
    }
    if (diffy / this.segs < this.precision) {
      this.precision = diffy / this.segs;
    }
  }

  private wallPolygonHierarchy(pr: any[]) {
    const positions = pr.map(p => {
      return [p.longitude, p.latitude, p.height];
    });
    positions.push(positions[0]);
    const tempPolygon = turf.polygon([positions]);
    const origin = turf.centroid(tempPolygon).geometry.coordinates;
    this.mOrigin = { x: origin[0], y: origin[1] };
    const bigPolygon = turf.transformScale(tempPolygon, 1000, {
      origin: origin
    });
    const line = turf.polygonToLine(bigPolygon);
    let wall = turf.buffer(line, 0.05);
    wall = turf.intersect(wall, bigPolygon);
    if (wall === null) {
      return;
    }
    wall = turf.transformScale(wall, 0.001, { origin: origin });
    var polygonHierarchy = this.createPolygonHierarchy(
      wall.geometry.coordinates
    );
    return polygonHierarchy;
  }

  private createPolygonHierarchy(coordinates: turf.helpers.Position[][]) {
    var holes = [];
    for (var i = 1, len = coordinates.length; i < len; i++) {
      holes.push(
        new Cesium.PolygonHierarchy(
          this.coordinatesArrayToCartesianArray(
            coordinates[i],
            this.crsFunction
          )
        )
      );
    } //挖洞
    var positions = coordinates[0];
    var polygonHierarchy = new Cesium.PolygonHierarchy(
      this.coordinatesArrayToCartesianArray(positions, this.crsFunction),
      holes
    );
    return polygonHierarchy;
  }

  private crsFunction(coordinates: turf.helpers.Position): any {
    return Cesium.Cartesian3.fromRadians(
      coordinates[0],
      coordinates[1],
      coordinates[2]
    );
  }
  private coordinatesArrayToCartesianArray(
    coordinates: any[],
    crsFunction: Function
  ) {
    return coordinates.map(coo => crsFunction(coo));
  }

  private maxAndminHeight(points: any[]) {
    return new Promise(resolve => {
      var positions = points.map(point => {
        const temp = Cesium.Cartographic.fromCartesian(point);
        return Cesium.Cartographic.fromRadians(temp.longitude, temp.latitude);
      });
      var promise = Cesium.sampleTerrainMostDetailed(
        this.terrainProvider,
        positions
      );
      Cesium.when(promise, (updatedPositions: Array<any>) => {
        let max = updatedPositions[0].height;
        let min = updatedPositions[0].height;
        for (let i = 1; i < updatedPositions.length; i++) {
          if (updatedPositions[i].height > max) {
            max = updatedPositions[i].height;
          } else if (updatedPositions[i].height < min) {
            min = updatedPositions[i].height;
          }
        }
        resolve({ min, max, uPoints: updatedPositions });
      });
    });
  }
}

export interface BackFillOptions extends PickPointOptions {
  terrainProvider: any;
}

interface PointInfo {
  x: number;
  y: number;
  height: number;
}
