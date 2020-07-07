import { DistanceOption } from './../models/options';
import { area as turfArea, polygon as turfPolygon } from '@turf/turf';
import { Subject } from 'rxjs';
export default class Drawer {

  subject: Subject<any>; // 用以向外传递状态以及数据

  private viewer: any;
  private scene: any;
  private camera: any;
  private tempHandler: any; // 用于临时缓存handler，多次调用绘制函数会处理掉之前的handler

  private entities: Array<any>;

  // draw-text
  private textContent = null;

  // 移动改变实体
  private entityMove = null;

  constructor(viewer) {
    this.viewer = viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
    this.entities = [];
    // tslint:disable-next-line: no-use-before-declare
    this.entityMove = new DrawerEntityMove(viewer, this);
    this.subject = new Subject<any>();
  }

  // 绘制点
  drawPoint() {
    const handler = this.startDraw('point');
    // 单击
    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian) { return false; }
      this.addPointEntity(cartesian);
      this.endDraw(handler);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // 绘制文字
  drawText() {
    const handler = this.startDraw('text');
    // 单击
    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian) { return false; }
      this.addTextInput(handler, movement);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // 绘制多边形空间或贴地距离折线
  drawPolyLine(clampToGround: boolean, record = false) {
    const handler = this.startDraw('polyline');
    const positions = [];
    let labelEntity: any;
    let totalDistance = 0;
    // 单击
    handler.setInputAction(movement => {
      // console.log(movement);
      const cartesian = this.getSpaceCartesian(movement);
      // console.log(cartesian);
      if (!cartesian) { return false; }
      if (positions.length === 0) {
        positions.push(cartesian.clone());
        this.addPolyLineEntity(positions, clampToGround);
        if (record) {
          this.addLabelEntity(cartesian, {
            text: '起点',
          });
        }
      }
      if (positions.length > 1) {
        const len = positions.length;
        totalDistance = this.getDistance({
          startCartesian: positions[len - 2],
          endCartesian: positions[len - 1],
          total: totalDistance,
          clampToGround
        });
        if (record) {
          const text = this.formatDistance(totalDistance);
          labelEntity.label.text.setValue(text);
        }
      }
      positions.push(cartesian);
      if (record) {
        labelEntity = this.addLabelEntity(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 移动
    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian || positions.length === 0) { return false; }
      positions.splice(-1, 1, cartesian);
      if (record) {
        labelEntity.position.setValue(cartesian);
      }
      const len = positions.length;
      const currentDistance = this.getDistance({
        startCartesian: positions[len - 2],
        endCartesian: positions[len - 1],
        total: totalDistance,
        clampToGround
      });
      if (record) {
        const text = this.formatDistance(currentDistance);
        labelEntity.label.text.setValue(`总长度：${text}`);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    // 双击
    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian) { return false; }
      // 去掉两个实体和两个坐标，分别是move中的和单次点击多添加的
      positions.splice(-2, 2);
      if (record) {
        let lastLabelEntity = this.entities.pop();
        this.viewer.entities.remove(lastLabelEntity);
        lastLabelEntity = this.entities.pop();
        this.viewer.entities.remove(lastLabelEntity);
        // 修改此时最一个label的text
        labelEntity = this.entities[this.entities.length - 1];
        const text = this.formatDistance(totalDistance);
        labelEntity.label.text.setValue(`总长度：${text}`);
      }
      this.subject.next({ positions, distance: totalDistance, type: 'polyline' }); // 将总长度传播出去，单位 “米”
      this.endDraw(handler);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  // 绘制多边形空间或贴地面积
  drawSurfacePolyArea(clampToGround: boolean, record = false) {
    const handler = this.startDraw('polygon');
    const positions = [];
    const linePositions = [];
    // tslint:disable-next-line:one-variable-per-declaration
    let labelEntity, area;

    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian) { return false; }
      if (positions.length === 0) {
        positions.push(cartesian.clone());
        this.addPolygonEntity(positions, clampToGround);
        if (record) {
          labelEntity = this.addLabelEntity(cartesian);
        }
      }
      positions.push(cartesian);
      if (positions.length === 2) {
        linePositions.push(...positions, positions[0]);
        this.addPolyLineEntity(linePositions, clampToGround);
      } else if (positions.length > 2) {
        linePositions.splice(-1, 0, cartesian);
      }
      // console.log(linePositions);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian || positions.length === 0) { return false; }
      positions.splice(-1, 1, cartesian);
      linePositions.splice(-2, 1, cartesian);
      area = Number(this.getArea(positions, true));
      if (area === 0) { return false; }
      if (record) {
        labelEntity.position.setValue(cartesian);
        labelEntity.label.text.setValue(`共 ${this.formatArea(area)}`);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(movement => {
      positions.splice(-2, 2);
      linePositions.splice(-3, 2);
      this.subject.next({ positions: linePositions, area, type: 'polygon' });
      this.endDraw(handler);
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  // 绘制三角测量的高度与长度
  drawTriangleHeightLine() {
    const handler = this.startDraw('triangle');
    const positions = [];
    let startCartographic;
    // tslint:disable-next-line:one-variable-per-declaration
    let slashLabel, heightLabel, horizonLabel;

    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian) { return false; }
      if (positions.length === 0) {
        startCartographic = Cesium.Cartographic.fromCartesian(cartesian);
        positions.push(cartesian.clone(), cartesian.clone(), cartesian.clone(), cartesian);
        this.addPolyLineEntity(positions, false);
        slashLabel = this.addLabelEntity(positions[0]);
        heightLabel = this.addLabelEntity(positions[1]);
        horizonLabel = this.addLabelEntity(positions[2]);
      } else {
        const { slashLength, horizonLength, heightLength } = this.getTriangleLength(positions[0], positions[1]);
        this.subject.next({ positions: positions.slice(0, -1), slashLength, horizonLength, heightLength, type: 'triangle' });
        this.endDraw(handler);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(movement => {
      const cartesian = this.getSpaceCartesian(movement);
      if (!cartesian || positions.length === 0) { return false; }
      positions.splice(1, 1, cartesian);
      const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
      // tslint:disable:one-variable-per-declaration
      let longitude, latitude, height, slashCartesian, heightCartesian, horizonCartesian;
      if (endCartographic.height > startCartographic.height) {
        longitude = Cesium.Math.toDegrees(startCartographic.longitude);
        latitude = Cesium.Math.toDegrees(startCartographic.latitude);
        height = endCartographic.height;
        slashCartesian = this.getMidPoint(positions[0], positions[1]);
        horizonCartesian = this.getMidPoint(positions[1], positions[2]);
        heightCartesian = this.getMidPoint(positions[2], positions[3]);
      } else {
        longitude = Cesium.Math.toDegrees(endCartographic.longitude);
        latitude = Cesium.Math.toDegrees(endCartographic.latitude);
        height = startCartographic.height;
        slashCartesian = this.getMidPoint(positions[0], positions[1]);
        heightCartesian = this.getMidPoint(positions[1], positions[2]);
        horizonCartesian = this.getMidPoint(positions[2], positions[3]);
      }
      const { slashLength, horizonLength, heightLength } = this.getTriangleLength(positions[0], positions[1]);
      const newCartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
      positions.splice(2, 1, newCartesian);
      slashLabel.position.setValue(slashCartesian);
      slashLabel.label.text.setValue(`空间距离：${this.formatDistance(slashLength)}`);
      heightLabel.position.setValue(heightCartesian);
      heightLabel.label.text.setValue(`垂直高度：${this.formatDistance(heightLength)}`);
      horizonLabel.position.setValue(horizonCartesian);
      horizonLabel.label.text.setValue(`水平距离：${this.formatDistance(horizonLength)}`);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 清空所有绘制内容
  clear() {
    this.entities.forEach(el => {
      this.viewer.entities.remove(el);
    });
    this.entities = [];
  }

  // 开始绘制的准备
  private startDraw(name?: string): any {
    name = name ? `start_draw_${name}` : 'start_draw';
    if (this.tempHandler) { this.tempHandler.destroy(); }
    this.tempHandler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
    this.scene.canvas.style.cursor = 'crosshair'; // 鼠标变化
    this.subject.next(name);
    return this.tempHandler;
  }

  // 结束绘制的准备
  private endDraw(handler) {
    this.scene.canvas.style.cursor = 'auto'; // 鼠标变化
    handler.destroy();
    this.subject.next('end_draw');
  }

  // 计算获取三角测量的高度和距离
  private getTriangleLength(startCartesian, endCartesian) {
    const startCartographic = Cesium.Cartographic.fromCartesian(startCartesian);
    const endCartographic = Cesium.Cartographic.fromCartesian(endCartesian);
    const heightLength = Math.abs(startCartographic.height - endCartographic.height);
    const slashLength = this.getDistance({
      startCartesian,
      endCartesian,
      total: 0,
      clampToGround: false
    });
    const horizonLength = Math.sqrt(Math.abs(Math.pow(slashLength, 2) - Math.pow(heightLength, 2)));
    return { slashLength, heightLength, horizonLength };
  }

  // 得到位于三维空间上的笛卡尔坐标位置
  private getSpaceCartesian(movement) {
    const position = movement.position || movement.endPosition;
    let cartesian;
    const pickedObject = this.scene.pick(position);
    if (Cesium.defined(pickedObject) && (!pickedObject.id || !pickedObject.id.name
      || !pickedObject.id.name.startsWith('drawer'))) { // 触碰到非此线段以及标签的实体
      // 获取三维模型上的坐标
      cartesian = this.scene.pickPosition(position);
    } else {
      // 获取地形上的坐标
      const ray = this.camera.getPickRay(position);
      cartesian = this.scene.globe.pick(ray, this.scene);
    }
    return cartesian;
  }

  // 添加描述性内容label实体
  private addLabelEntity(cartesian, opts?) {
    const text = opts ? opts.text || '' : '';
    const label = this.viewer.entities.add({
      name: 'drawer_label',
      position: cartesian,
      point: {
        show: false
      },
      label: {
        text,
        font: '16px sans-serif',
        fillColor: Cesium.Color.GOLD,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -23),
      }
    });
    this.entities.push(label);
    return label;
  }

  // 添加点的实体
  private addPointEntity(cartesian) {
    const pointEntity = this.viewer.entities.add({
      position: cartesian,
      point: {
        color: Cesium.Color.YELLOW,
        pixelSize: 10,
      }
    });
  }

  // 添加多边形折线实体
  private addPolyLineEntity(positions, clampToGround) {
    const polyLineEntity = this.viewer.entities.add({
      name: 'drawer_poly_line',
      polyline: {
        show: true,
        positions: new Cesium.CallbackProperty(() => {
          return positions;
        }, false),
        material: Cesium.Color.RED,
        width: 3,
        clampToGround
      }
    });
    this.entities.push(polyLineEntity);
    return polyLineEntity;
  }

  // 添加多边形
  private addPolygonEntity(positions, clampToGround) {
    const polygonEntity = this.viewer.entities.add({
      name: 'drawer_polygon',
      polygon: {
        hierarchy: new Cesium.CallbackProperty(() => {
          return { positions };
        }, false),
        perPositionHeight: !clampToGround, // 这个为true则不贴地
        material: Cesium.Color.RED.withAlpha(0.5),
      }
    });
    this.entities.push(polygonEntity);
    return polygonEntity;
  }

  // 根据经纬度求得空间距离或者贴地距离
  private getDistance(opts: DistanceOption) {
    const startCartographic = Cesium.Cartographic.fromCartesian(opts.startCartesian);
    const endCartographic = Cesium.Cartographic.fromCartesian(opts.endCartesian);
    const geodesic = new Cesium.EllipsoidGeodesic();
    geodesic.setEndPoints(startCartographic, endCartographic);
    const surfaceDistance  = geodesic.surfaceDistance; // 贴地距离
    if (opts.clampToGround) {
      return opts.total + surfaceDistance;
    }
    const height = endCartographic.height - startCartographic.height; // 高度
    const spaceDistance = Math.sqrt(Math.pow(surfaceDistance , 2) + Math.pow(height, 2));
    return opts.total + spaceDistance;
  }

  // 计算面积（暂时只有贴地面积）
  private getArea(positions, clampToGround) {
    if (positions.length < 3) { return 0; }
    const points = positions.map(cartesian => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      return [lon, lat];
    });
    return turfArea(turfPolygon([[...points, points[0]]]));
  }

  // 计算两个点的中点坐标
  private getMidPoint(startCartesian, endCartesian) {
    const newCartesian = startCartesian.clone();
    newCartesian.x = (startCartesian.x + endCartesian.x) / 2;
    newCartesian.y = (startCartesian.y + endCartesian.y) / 2;
    newCartesian.z = (startCartesian.z + endCartesian.z) / 2;
    return newCartesian;
  }

  private formatDistance(distance) {
    if (distance < 1000) {
      return distance.toFixed(2) + '米';
    } else {
      return (distance / 1000).toFixed(2) + '公里';
    }
  }

  private formatArea(area) {
    if (area < 100000) {
      return area.toFixed(2) + ' 平方米';
    } else if (area > 10000000000) {
      return (area / 10000000000).toFixed(2) + ' 万平方公里';
    } else {
      return (area / 1000000).toFixed(2) + ' 平方公里';
    }
  }

  // 添加文字输入框
  private addTextInput(handler, movement) {
    const cartesian = this.getSpaceCartesian(movement);
    const inputHtml = `<style>
      body {
        background-color: black;
      }
      .text-box {
        display: flex;
        flex-direction: column;
        width: 250px;
        background-color: rgba(0,0,0,0.5);
      }
      .text-box > textarea {
        resize: none;
        background: none;
        color: #ffffff;
        outline: none;
        border-color: #2ab0e6;
        height: 60px;
      }
      .text-box > button {
        border: none;
        background-color: #2ab0e6;
        color: #ffffff;
        outline: none;
        border-color: #2ab0e6;
      }
      .text-box > button:hover {
        cursor: pointer;
        filter: brightness(1.1);
      }
    </style>
    <div class="text-box">
      <textarea class="draw-text-content" placeholder="请输入想要显示的文本"></textarea >
      <button class="draw-text-ensure">确定</button>
    </div>
    `;
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.innerHTML = inputHtml;
    box.style.left = movement.position.x + 10 + 'px';
    box.style.top = movement.position.y + 10 + 'px';
    this.scene.canvas.parentElement.appendChild(box);
    const area: any = box.querySelector('.draw-text-content');
    const btnEnsure = box.querySelector('.draw-text-ensure');
    btnEnsure.addEventListener('click', e => {
      const label = this.viewer.entities.add({
        name: 'draw_text',
        position: cartesian,
        point: {
          show: false
        },
        label: {
          text: area.value,
          font: '18px sans-serif',
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        }
      });
      this.entities.push(label);
      area.value = '';
      this.endDraw(handler);
      this.scene.canvas.parentElement.removeChild(box);
    });
  }

}

class DrawerEntityMove {

  private drawer: Drawer;
  private viewer: any;
  private scene: any;
  private camera: any;

  private typeSet: Set<string>;

  constructor(viewer, drawer) {
    this.drawer = drawer;
    this.viewer = viewer;
    this.viewer = viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
    this.listenClickEvent();
    // this.typeSet = new Set([
    //   'draw_'
    // ]);
  }

  // 监听点击
  listenClickEvent() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
    handler.setInputAction(movement => {
      const { x, y } = movement.position;
      const cartesian3 = this.screenToCartesian3(x, y);
      console
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  screenToCartesian3(x, y) {
    const pick = new Cesium.Cartesian2(x, y);
    const cartesian = this.scene.globe.pick(this.camera.getPickRay(pick), this.scene);
    return cartesian;
  }

}
