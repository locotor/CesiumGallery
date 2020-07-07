import * as turf from '@turf/turf';
import { Subject } from 'rxjs';

const SPEED_FACTOR = 3.6; // 米转化为千米的因子
const INTERVAL = 160; // 状态计算间隔(毫秒)

export enum SpeedUnit {
  METRE_PER_SECOND = 'm/s',
  KILOMETRE_PER_HOUR = 'km/h'
}

export enum EntityStatus {
  PLAYING = 'playing',
  PAUSE = 'pause',
  PLAY_END = 'play end',
}


export class Walkthrough {

  private viewer: any;
  private speedPerSec: number;
  private speedPerFrame: number;
  private start: any;
  private end: any;
  private duration: number;
  /** 两次循环时间间隔,单位`ms` */
  private delayBetweenLoop = 1000;
  private property: any;
  private positions: any[];
  private planeModel: any;
  private autoplay = false;
  private isLoop = false;
  private mMultiplier = 1;
  private clock: any;
  private clockViewModel: any;
  private points: PathPoint[];
  private travelBlock: TravelBlock;
  private status: EntityStatus;
  private staticModal: any;
  private playedTime = 0;
  get multiplier() {
    return this.mMultiplier;
  }

  public propertyChange = new Subject<{ type: string, value: any }>();

  constructor(options: WalkthroughOption) {
    this.viewer = options.viewer;
    this.clock = this.viewer.clock;
    this.clockViewModel = this.viewer.clockViewModel;
    this.autoplay = options.autoPlay || options.loop;
    this.isLoop = options.loop;
    this.points = options.points;
    this.travelBlock = options.travelBlock || {};
    this.convertSpeed(options.speed, options.unit);
    this.positions = this.points.map(point => {
      return Cesium.Cartesian3.fromDegrees(point.x, point.y, point.z || 0);
    });
    this.setViewClock();
    this.addBackgroudLine();
    if (this.autoplay) {
      this.startPlayModal();
    }
  }

  /**
   * 计算速度，统一转化为`米/秒`
   */
  private convertSpeed(speed: number, unit = SpeedUnit.METRE_PER_SECOND) {
    let spdsec: number;
    switch (unit) {
      case SpeedUnit.METRE_PER_SECOND:
        spdsec = speed;
        break;
      case SpeedUnit.KILOMETRE_PER_HOUR:
        spdsec = speed / SPEED_FACTOR;
        break;
    }
    this.speedPerSec = Math.round(spdsec * 1000) / 1000;
    this.propertyChange.next({ type: 'speed', value: this.speedPerSec });
    this.speedPerFrame = spdsec * INTERVAL / 1000;
  }

  private computeDuration(path: PathPoint[]) {
    const line = turf.lineString(path.map(point => [point.x, point.y, point.z || 0]));
    const length = turf.length(line, { units: 'metres' });
    const dura = Math.floor(length / this.speedPerSec) + 1;
    this.duration = dura * 1000;
  }

  private setViewClock() {
    this.clock.onTick.addEventListener((clock) => {
      if (this.isLoop && this.end
        && this.compareTime(clock.currentTime, this.end) === 1
        && this.planeModel &&
        !this.planeModel.isAvailable(clock.currentTime)) {
        this.startPlayModal();
      } else if (!this.isLoop
        && this.end
        && this.status
        && this.status === EntityStatus.PLAYING
        && this.compareTime(clock.currentTime, this.end) === 1) {
        this.status = EntityStatus.PLAY_END;
      }
    });
    this.clockViewModel.clockRange = Cesium.ClockRange.UNBOUNDED;
    this.clockViewModel.multiplier = this.mMultiplier;
    this.clockViewModel.canAnimate = true;
  }

  private compareTime(time1: any, time2: any) {
    if (time1.dayNumber > time2.dayNumber) {
      return 1;
    } else if (time2.dayNumber > time1.dayNumber) {
      return -1;
    } else if (time1.secondsOfDay > time2.secondsOfDay) {
      return 1;
    } else if (time2.secondsOfDay > time2.secondsOfDay) {
      return -1;
    } else {
      return 0;
    }
  }

  /** 单次播放 */
  singlePlay() {
    this.playedTime = 0;
    this.startPlayModal();
  }

  /** 循环播放 */
  loopPlayback() {
    this.playedTime = 0;
    this.isLoop = true;
    this.startPlayModal();
  }

  /** 暂停 */
  pause() {
    const currentTime = this.clockViewModel.currentTime;
    if (this.planeModel && this.planeModel.isAvailable(currentTime)) {
      const currentPosition = this.planeModel.position.getValue(this.clockViewModel.currentTime);
      const currentOrientation = this.planeModel.orientation.getValue(this.clockViewModel.currentTime);
      this.createStaticModal(currentPosition, currentOrientation, this.travelBlock);
      this.addStaticModal();
      this.status = EntityStatus.PAUSE;
      this.playedTime = Cesium.JulianDate.secondsDifference(currentTime, this.start);
    }
  }

  /** 播放 */
  play() {
    if (this.status === EntityStatus.PAUSE) {
      this.startPlayModal();
      this.playedTime = 0;
    }

  }

  /** 停止 */
  stop() {
    this.removeModel();
    this.removeStaticModel();
    this.isLoop = false;
  }

  /** 加速 */
  playFaster() {
    this.changeSpeed(this.speedPerSec * 2);
  }

  /** 减速 */
  playSlower() {
    this.changeSpeed(this.speedPerSec / 2);
  }

  /**
   * 设置时钟速度,实际速度为 `Math.pow(2,exponent)`
   * 默认时钟播放速度为 `1`
   */
  setPlaySpeed(exponent: number) {
    this.clockViewModel.multiplier = this.multiplier;
  }

  changeTravelModel(travelBlock: TravelBlock = {}) {
    this.travelBlock = travelBlock;
    this.changeSpeed(this.speedPerSec);
  }

  private addModal() {
    if (!this.viewer.entities.getById(this.planeModel.id)) {
      this.removeStaticModel();
      this.viewer.entities.add(this.planeModel);
    }
  }

  private addStaticModal() {
    if (!this.viewer.entities.getById(this.staticModal.id)) {
      this.removeModel();
      this.viewer.entities.add(this.staticModal);
    }
  }

  private startPlayModal() {
    const current = this.clockViewModel.currentTime;
    this.start = new Cesium.JulianDate(current.dayNumber, current.secondsOfDay);
    this.clockViewModel.currentTime = this.start.clone();
    if (this.playedTime && this.playedTime > 0) {
      this.start = Cesium.JulianDate.addSeconds(this.start, (-1) * this.playedTime, new Cesium.JulianDate());
    }
    this.computeDuration(this.points);
    this.end = Cesium.JulianDate.addSeconds(this.start,
      (this.duration + this.delayBetweenLoop) / 1000,
      new Cesium.JulianDate());
    this.computePosition(this.points);
    this.createModal(this.travelBlock);
    this.addModal();
    this.status = EntityStatus.PLAYING;
  }

  private computePosition(path: PathPoint[]) {
    const property = new Cesium.SampledPositionProperty();
    let index = 0;
    const len = path.length;
    if (len > 0) {
      const p0 = Cesium.Cartesian3.fromDegrees(path[0].x, path[0].y, path[0].z || 0);
      property.addSample(this.start, p0);
      let totalTime = this.start;
      while (index < len - 1) {
        const pre = path[index];
        const next = path[index + 1];
        const dis = turf.distance([pre.x, pre.y, pre.z || 0], [next.x, next.y, next.z || 0], { units: 'metres' });
        const preData = totalTime;
        if (dis > this.speedPerFrame * 4) {
          const times = Math.floor(dis / this.speedPerFrame);
          let division = 2;
          const diffx = (next.x - pre.x) / times;
          const diffy = (next.y - pre.y) / times;
          const diffz = ((next.z || 0) - (pre.z || 0)) / times;
          while (division < times) {
            const pnd = Cesium.Cartesian3.fromDegrees(pre.x + diffx * division, pre.y + diffy * division, (pre.z || 0) + diffz * division);
            const dtd = Math.round(dis / times * 1000 / this.speedPerSec) / 1000;
            totalTime = Cesium.JulianDate.addSeconds(totalTime, dtd * 2, new Cesium.JulianDate());
            property.addSample(totalTime, pnd);
            division += 2;
          }
        }
        const pn = Cesium.Cartesian3.fromDegrees(next.x, next.y, next.z || 0);
        const dt = Math.round(dis * 1000 / this.speedPerSec) / 1000;
        totalTime = Cesium.JulianDate.addSeconds(preData, dt, new Cesium.JulianDate());
        property.addSample(totalTime, pn);
        index = index + 1;
      }
    }
    this.property = property;
  }

  /**
   * 更改物体速度
   */
  public changeSpeed(speed: number, unit = SpeedUnit.METRE_PER_SECOND) {
    const oldSpeed = this.speedPerSec;
    this.convertSpeed(speed, unit);
    if (this.status === EntityStatus.PLAY_END) {
      return;
    }
    const factor = this.speedPerSec / oldSpeed;
    const currentTime = this.clockViewModel.currentTime.clone();
    const playedTime = this.getEntityPlayedTime(currentTime) / factor;
    this.start = new Cesium.JulianDate(currentTime.dayNumber, currentTime.secondsOfDay);
    this.clockViewModel.currentTime = this.start.clone();
    if (playedTime && playedTime > 0) {
      this.start = Cesium.JulianDate.addSeconds(this.start, (-1) * playedTime, new Cesium.JulianDate());
    }
    this.computeDuration(this.points);
    this.end = Cesium.JulianDate.addSeconds(this.start,
      (this.duration + this.delayBetweenLoop) / 1000,
      new Cesium.JulianDate());
    this.computePosition(this.points);
    this.createModal(this.travelBlock);
    this.processEntityWhenSpeedChange();
  }

  private getEntityPlayedTime(current: any) {
    if (this.status === EntityStatus.PAUSE) {
      return this.playedTime;
    } else if (this.status === EntityStatus.PLAYING) {
      return Cesium.JulianDate.secondsDifference(current, this.start);
    }
  }

  private processEntityWhenSpeedChange() {
    if (this.status === EntityStatus.PLAYING) {
      this.addModal();
    }
  }

  private createModal(travelBlock: TravelBlock = {}) {
    const {
      billboard,
      box,
      corridor,
      cylinder,
      ellipse,
      ellipsoid,
      label,
      model,
      path,
      plane,
      polygon,
      polyline,
      polylineVolume,
      rectangle,
      wall
    } = travelBlock;
    let point = travelBlock.point;
    if (!(billboard ||
      box ||
      corridor ||
      cylinder ||
      ellipse ||
      ellipsoid ||
      label ||
      model ||
      path ||
      plane ||
      point ||
      polygon ||
      polyline ||
      polylineVolume ||
      rectangle ||
      wall)) {
      point = this.createFlickerPoint();
    }
    const entity: any = new Cesium.Entity({
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start: this.start,
        stop: this.end
      })]),
      position: this.property,
      orientation: new Cesium.VelocityOrientationProperty(this.property),
      billboard,
      box,
      corridor,
      cylinder,
      ellipse,
      ellipsoid,
      label,
      model,
      path,
      plane,
      point,
      polygon,
      polyline,
      polylineVolume,
      rectangle,
      wall
    });
    this.removeModel();
    this.planeModel = entity;
  }

  private createStaticModal(
    cPositon: any,
    cOrientation: any,
    travelBlock: TravelBlock = {}
  ) {
    const {
      billboard,
      box,
      corridor,
      cylinder,
      ellipse,
      ellipsoid,
      label,
      model,
      path,
      plane,
      polygon,
      polyline,
      polylineVolume,
      rectangle,
      wall
    } = travelBlock;
    let point = travelBlock.point;
    if (!(billboard ||
      box ||
      corridor ||
      cylinder ||
      ellipse ||
      ellipsoid ||
      label ||
      model ||
      path ||
      plane ||
      point ||
      polygon ||
      polyline ||
      polylineVolume ||
      rectangle ||
      wall)) {
      point = this.createFlickerPoint();
    }
    const entity = new Cesium.Entity({

      position: cPositon,
      orientation: cOrientation,
      billboard,
      box,
      corridor,
      cylinder,
      ellipse,
      ellipsoid,
      label,
      model,
      path,
      plane,
      point,
      polygon,
      polyline,
      polylineVolume,
      rectangle,
      wall
    });
    this.removeStaticModel();
    this.staticModal = entity;
  }

  private removeModel() {
    if (this.planeModel) {
      this.viewer.entities.removeById(this.planeModel.id);
      this.planeModel = null;
    }
  }

  private removeStaticModel() {
    if (this.staticModal) {
      this.viewer.entities.removeById(this.staticModal.id);
      this.staticModal = null;
    }
  }

  private createFlickerPoint() {
    return new Cesium.PointGraphics({
      show: true,
      color: Cesium.Color.ORANGERED,
      pixelSize: 20,
      outlineWidth: 0
    });
  }

  private addBackgroudLine() {
    const color = new Cesium.ColorMaterialProperty(Cesium.Color.GRAY.withAlpha(0.8));
    const line = new Cesium.Entity({
      polyline: new Cesium.PolylineGraphics({
        show: true,
        positions: this.positions,
        width: 3.0,
        material: color
      })
    });
    this.viewer.entities.add(line);
  }
}


export interface WalkthroughOption {
  /** cesium viewer */
  viewer: any;
  /** 运行轨迹 */
  points: PathPoint[];
  /** 运行速度 */
  speed: number;
  /** 速度单位,默认为 `m/s` */
  unit?: SpeedUnit;
  /** 是否自动开启追踪,默认为 `false` */
  autoPlay?: boolean;
  /** 是否循环播放,默认为 `false`; 为 `true`时, `autoplay` 为 `true` */
  loop?: boolean;
  travelBlock?: TravelBlock;

}

export interface TravelBlock {
  billboard?: any;
  box?: any;
  corridor?: any;
  cylinder?: any;
  ellipse?: any;
  ellipsoid?: any;
  label?: any;
  model?: any;
  path?: any;
  plane?: any;
  point?: any;
  polygon?: any;
  polyline?: any;
  polylineVolume?: any;
  rectangle?: any;
  wall?: any;
}

export interface PathPoint {
  /** 点精度 */
  x: number;
  /** 点纬度 */
  y: number;
  /** 点高度 */
  z?: number;
}

