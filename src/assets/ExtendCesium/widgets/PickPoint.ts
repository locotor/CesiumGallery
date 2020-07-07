
import { Subject } from "rxjs";

/**
 * 地图取点方法类
 */
export class PickPoint {
  private mviewer: any;
  private handler: any;
  private points: any[];
  private temporaryPoint: any;

  private leftClickTimer: any;

  get viewer() {
    return this.mviewer;
  }

  private pointInfo: Subject<PointInfo>;

  constructor(options: PickPointOptions) {
    this.mviewer = options.viewer;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    //去掉默认的左键双击放大地图事件
    this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    this.points = [];
  }

  public startPick() {
    this.points = [];
    this.temporaryPoint = null;
    this.AddLeftClickHandler();
    this.AddMousemoveHandler();
    this.AddRightClickHandler();
    this.AddLeftDoubleClickHandler();
    this.destoryob();
    (this.viewer.container as HTMLElement).style.cursor="crosshair"
    this.pointInfo = new Subject();
    return this.pointInfo;
  }

  private destoryob() {
    if (this.pointInfo) {
      this.pointInfo.complete();
      this.pointInfo.unsubscribe();
      this.pointInfo = null;
    }
  }

  private AddLeftClickHandler() {
    this.handler.setInputAction((event: any) => {
      clearTimeout(this.leftClickTimer);
      this.leftClickTimer = setTimeout(() => {
        const earthPosition = this.viewer.scene.pickPosition(event.position);
        if (Cesium.defined(earthPosition)) {
          this.points.push(earthPosition);
          this.pointInfo.next({
            points: this.points,
            currentPoint: earthPosition,
            temporaryPoint: null,
            opt: "pick"
          });
        }
      }, 300);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private AddMousemoveHandler() {
    this.handler.setInputAction((event: any) => {
      this.temporaryPoint = this.viewer.scene.pickPosition(event.endPosition);
      this.pointInfo.next({
        points: this.points,
        currentPoint: null,
        temporaryPoint: this.temporaryPoint,
        opt: "move"
      });
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  private AddRightClickHandler() {
    this.handler.setInputAction((event: any) => {
      if (this.points.length >= 1) {
        const point = this.points.pop();
        this.pointInfo.next({
          points: this.points,
          currentPoint: point,
          temporaryPoint: this.temporaryPoint,
          opt: "del"
        });
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private AddLeftDoubleClickHandler() {
    this.handler.setInputAction((event: any) => {
      clearTimeout(this.leftClickTimer);
      const earthPosition = this.viewer.scene.pickPosition(event.position);
      this.points.push(earthPosition);
      this.pointInfo.next({
        points: this.points,
        currentPoint: earthPosition,
        temporaryPoint: null,
        opt: "end"
      });
      (this.viewer.container as HTMLElement).style.cursor="default"
      this.temporaryPoint = null;
      this.points = [];
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }
}

export interface PickPointOptions {
  viewer: any;
}

export interface PointInfo {
  points: any[];
  currentPoint: any;
  temporaryPoint: any;
  opt: "pick" | "move" | "del" | "end";
}
