import { BackFill, BackFillOptions } from "./BackFill";


export class Inundation extends BackFill {
  private flowRate: number;
  private fvolume: number;
  private minHeight: number;
  private modelEntity: any;
  private dataSource: any;

  constructor(options: InundationOptions) {
    super(options);
    this.flowRate = options.flowRate;
    this.bfInfo.subscribe(info => {
      this.fvolume = info.fvolume;
      this.minHeight = this.deepestPoint();
      this.setFill();
    });
  }

  public startPick() {
    const pob = super.startPick();
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
      // var model = this.dataSource.entities.getById("model");
      // this.viewer.entities.removeById(model.id);
      this.dataSource = null;
    }
    return pob;
  }

  private CalcInundation() {
    let posInfo: { time: number; height: number }[] = [];
    let height = this.minHeight + 1;
    let preHeight = this.minHeight;
    let preTime = 0;
    let factor = 100;
    const totalTime = Math.round(
      (this.fvolume * 1000) / (this.flowRate * factor)
    );
    while (height < this.tHeight) {
      const volume = this.calcVolume(height).fvolume;
      const time = Math.round((volume * 1000) / (this.flowRate * factor));
      if (time - preTime > 160) {
        posInfo.push({ time, height });
        preHeight = height;
        preTime = time;
      }
      height = height + 1;
    }
    posInfo.push({ time: totalTime + 1000, height: this.tHeight });
    return posInfo;
  }

  private timeRefToYear(posInfo: { time: number; height: number }[]) {
    let time_ref = [];
    let start = 1970;
    let totalTime = posInfo[posInfo.length - 1].time;
    let currentYear = new Date().getFullYear();
    let time_step = Math.floor(totalTime / (currentYear - start - 10));
    let num = 1;
    time_ref.push(String(start));
    time_ref.push(posInfo[0].height);
    for (let i = 1; i < posInfo.length; i++) {
      if (posInfo[i].time > num * time_step) {
        num = Math.floor(posInfo[i].time / time_step);
        time_ref.push(String(start + num));
        time_ref.push(posInfo[i].height);
        num = num + 1;
      }
    }
    time_ref.push(String(currentYear - 2));
    time_ref.push(posInfo[posInfo.length - 1].height);
    time_ref.push(String(currentYear));
    time_ref.push(posInfo[posInfo.length - 1].height);
    return time_ref;
  }

  private generateCzml(posInfo: { time: number; height: number }[]) {
    let time_ref = this.timeRefToYear(posInfo);
    const cgd = [];
    this.bPolygon.forEach(bp => {
      let bpg = Cesium.Cartographic.fromCartesian(bp);
      cgd.push(Cesium.Math.toDegrees(bpg.longitude));
      cgd.push(Cesium.Math.toDegrees(bpg.latitude));
      cgd.push(Cesium.Math.toDegrees(0));
    });

    return [
      {
        id: "document",
        name: "CZML Custom Properties",
        version: "1.0",
        clock: {
          interval: `1970/${new Date().getFullYear()}`,
          currentTime: "1970",
          multiplier: 500000000
        }
      },
      {
        id: "model",
        name: "model",
        properties: {
          constant_property: true,
          time_height: {
            number: time_ref
          }
        },
        polygon: {
          positions: {
            cartographicDegrees: cgd
          },
          material: {
            solidColor: {
              color: {
                rgba: [64, 157, 253, 150]
              }
            }
          },
          height: 0,
          extrudedHeight: 0
        }
      }
    ];
  }

  private setFill() {
    if (this.modelEntity) {
      this.viewer.entities.removeById(this.modelEntity.id);
      this.modelEntity = null;
    }
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
      var model = this.dataSource.entities.getById("model");
      console.log(model);
      this.viewer.entities.removeById(model.id);
      this.dataSource = null;
    }
    const pathInfo = this.CalcInundation();
    const czml = this.generateCzml(pathInfo);
    this.addCzml(czml);
  }

  private addCzml(czml: any) {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource);
    }
    this.dataSource = new Cesium.CzmlDataSource();
    this.dataSource.load(czml);
    this.viewer.dataSources.add(this.dataSource);
    var customPropertyObject = this.dataSource.entities.getById("model");
    var property = customPropertyObject.properties["time_height"];
    var model = this.dataSource.entities.getById("model");
    model.polygon.extrudedHeight = this.scaleProperty(property, 1 / 1.0);
    this.viewer.zoomTo(this.dataSource);
  }
  private scaleProperty(property: any, scalingFactor: any) {
    return new Cesium.CallbackProperty(function(time: any, result: any) {
      result = property.getValue(time, result);
      result = result * scalingFactor;
      return result;
    }, property.isConstant);
  }

  public setTargetHeight(height: number) {}
}

export interface InundationOptions extends BackFillOptions {
  /** 注水流量,单位`立方米/秒` */
  flowRate: number;
}
