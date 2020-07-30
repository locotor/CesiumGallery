import * as Cesium from 'cesium';
import { alg } from './algorithm.js';

//#region 直线箭头
export class StraightArrow {

    type = 'StraightArrow';
    objId = Number((new Date()).getTime() + '' + Number(Math.random() * 1000).toFixed(0)); // 用于区分多个相同箭头时
    handler = null;
    pointImageUrl = 'img/point.png';
    fillMaterial = Cesium.Color.fromCssColorString('#0000FF').withAlpha(0.8);
    outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
    });
    positions = [];
    firstPoint = null;
    floatPoint = null;
    arrowEntity = null;
    state = -1; // state用于区分当前的状态 0 为删除 1为添加 2为编辑
    selectPoint = null;
    clickStep = 0;
    modifyHandler = null;

    constructor(private viewer) {
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    disable() {
        this.positions = [];
        if (this.firstPoint) {
            this.viewer.entities.remove(this.firstPoint);
            this.firstPoint = null;
        }
        if (this.floatPoint) {
            this.viewer.entities.remove(this.floatPoint);
            this.floatPoint = null;
        }
        if (this.arrowEntity) {
            this.viewer.entities.remove(this.arrowEntity);
            this.arrowEntity = null;
        }
        this.state = -1;
        if (this.handler) {
            this.handler.destroy();
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        }
        if (this.selectPoint) {
            this.viewer.entities.remove(this.selectPoint);
            this.selectPoint = null;
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
        this.clickStep = 0;
    }

    disableHandler() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
    }

    startDraw() {
        const $this = this;
        this.state = 1;
        this.handler.setInputAction((evt) => { // 单机开始绘制
            let cartesian;
            cartesian = getCatesian3FromPX(evt.position, $this.viewer);
            if (!cartesian) { return; }
            if ($this.positions.length === 0) {
                $this.firstPoint = $this.creatPoint(cartesian);
                $this.firstPoint.type = 'firstPoint';
                $this.floatPoint = $this.creatPoint(cartesian);
                $this.floatPoint.type = 'floatPoint';
                $this.positions.push(cartesian);
            }
            if ($this.positions.length === 3) {
                $this.firstPoint.show = false;
                $this.floatPoint.show = false;
                $this.handler.destroy();
                $this.arrowEntity.objId = $this.objId;
                $this.state = -1;
            }
            $this.positions.push(cartesian.clone());
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((evt) => { // 移动时绘制面
            if ($this.positions.length < 1) { return; }
            let cartesian;
            cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
            if (!cartesian) { return; }

            $this.floatPoint.position.setValue(cartesian);
            if ($this.positions.length >= 2) {
                if (!Cesium.defined($this.arrowEntity)) {
                    $this.positions.push(cartesian);
                    $this.arrowEntity = $this.showArrowOnMap($this.positions);
                } else {
                    $this.positions.pop();
                    $this.positions.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    startModify() { // 修改箭头
        this.state = 2;
        this.firstPoint.show = true;
        this.floatPoint.show = true;
        const $this = this;
        this.clickStep = 0;
        if (!this.modifyHandler) { this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas); }
        this.modifyHandler.setInputAction((evt) => { // 单机开始绘制
            const pick = $this.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                $this.clickStep++;
                if (!pick.id.objId) {
                    $this.selectPoint = pick.id;
                }
            } else { // 激活移动点之后 单机面之外 移除这个事件
                $this.modifyHandler.destroy();
                $this.modifyHandler = null;
                $this.firstPoint.show = false;
                $this.floatPoint.show = false;
                $this.state = -1;
            }

            // 选中点后 第二次点击 则重新定位该点
            if ($this.clickStep === 2) {
                $this.clickStep = 0;
                let cartesian;
                cartesian = getCatesian3FromPX(evt.position, $this.viewer);
                if (!cartesian) { return; }
                if ($this.selectPoint) {
                    $this.selectPoint.position.setValue(cartesian);
                    $this.selectPoint = null;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.modifyHandler.setInputAction((evt) => {
            if ($this.selectPoint) {
                let cartesian;
                cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
                if (!cartesian) { return; }
                $this.selectPoint.position.setValue(cartesian);
                if ($this.selectPoint.type === 'firstPoint') {
                    $this.positions[1] = cartesian;
                }
                if ($this.selectPoint.type === 'floatPoint') {
                    $this.positions[2] = cartesian;
                }
            } else {
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    createByData(data) { // 通过传入的经纬度数组 构建箭头
        this.state = -1;
        this.positions = [];
        const arr = [];
        for (const d of data) {
            const cart3 = Cesium.Cartesian3.fromDegrees(d[0], d[1]);
            arr.push(cart3);
        }
        this.positions = arr;
        this.firstPoint = this.creatPoint(this.positions[1]);
        this.firstPoint.type = 'firstPoint';
        this.floatPoint = this.creatPoint(this.positions[2]);
        this.floatPoint.type = 'floatPoint';
        this.arrowEntity = this.showArrowOnMap(this.positions);
        this.firstPoint.show = false;
        this.floatPoint.show = false;
        this.arrowEntity.objId = this.objId;
    }

    clear() { // 清除绘制箭头
        this.state = 0;
        if (this.firstPoint) { this.viewer.entities.remove(this.firstPoint); }
        if (this.floatPoint) { this.viewer.entities.remove(this.floatPoint); }
        if (this.arrowEntity) { this.viewer.entities.remove(this.arrowEntity); }
        this.state = -1;
    }

    getLnglats() {
        const arr = [];
        for (const position of this.positions) {
            const item = this.cartesianToLatlng(position);
            arr.push(item);
        }
        return arr;
    }

    getPositions() { // 获取直角箭头中的关键点
        return this.positions;
    }

    creatPoint(cartesian) {
        const point = this.viewer.entities.add({
            position: cartesian,
            billboard: {
                image: this.pointImageUrl,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
        point.attr = 'editPoint';
        return point;
    }

    showArrowOnMap(positions) {
        const $this = this;
        const update = () => {
            if (positions.length < 2) {
                return null;
            }
            const p1 = positions[1];
            const p2 = positions[2];
            const firstPoint = $this.cartesianToLatlng(p1);
            const endPoints = $this.cartesianToLatlng(p2);
            const arrow = [];
            const res = alg.algorithm.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
            const index = JSON.stringify(res).indexOf('null');
            if (index !== -1) { return []; }
            for (const cartesian of res) {
                const c3 = new Cesium.Cartesian3(cartesian.x, cartesian.y, cartesian.z);
                arrow.push(c3);
            }
            return new Cesium.PolygonHierarchy(arrow);
        };
        return this.viewer.entities.add({
            polygon: new Cesium.PolygonGraphics({
                hierarchy: new Cesium.CallbackProperty(update, false),
                show: true,
                fill: true,
                material: $this.fillMaterial
            })
        });
    }

    cartesianToLatlng(cartesian) {
        const latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const lat = Cesium.Math.toDegrees(latlng.latitude);
        const lng = Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }

}


//#region 攻击箭头
export class AttackArrow {
    type = 'AttackArrow';
    objId = Number((new Date()).getTime() + '' + Number(Math.random() * 1000).toFixed(0));
    pointImageUrl = 'img/point.png';
    handler = null;
    fillMaterial = Cesium.Color.RED.withAlpha(0.8);
    outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
    });
    positions = []; // 控制点
    state = -1; // state用于区分当前的状态 0 为删除 1为添加 2为编辑
    floatPoint = null;
    arrowEntity = null;
    pointArr = []; // 中间各点
    selectPoint = null;
    clickStep = 0; // 用于控制点的移动结束
    modifyHandler = null;

    constructor(private viewer) {
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    }

    disable() {
        this.positions = [];
        if (this.arrowEntity) {
            this.viewer.entities.remove(this.arrowEntity);
            this.arrowEntity = null;
        }
        this.state = -1;
        if (this.handler) {
            this.handler.destroy();
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        }
        if (this.floatPoint) {
            this.viewer.entities.remove(this.floatPoint);
            this.floatPoint = null;
        }
        if (this.selectPoint) {
            this.viewer.entities.remove(this.selectPoint);
            this.selectPoint = null;
        }
        for (const point of this.pointArr) {
            if (point) { this.viewer.entities.remove(point); }
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
        this.clickStep = 0;
    }

    disableHandler() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
    }

    startDraw() {
        const $this = this;
        this.state = 1;
        this.handler.setInputAction((evt) => { // 单机开始绘制
            let cartesian;
            cartesian = getCatesian3FromPX(evt.position, $this.viewer);
            if (!cartesian) { return; }
            // var ray = viewer.camera.getPickRay(evt.position);
            // if (!ray) return;
            // var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
            if ($this.positions.length === 0) {
                $this.floatPoint = $this.creatPoint(cartesian);
                $this.floatPoint.wz = -1;
            }
            $this.positions.push(cartesian);
            const point = $this.creatPoint(cartesian);
            if ($this.positions.length > 2) {
                point.wz = $this.positions.length - 1; // 点对应的在positions中的位置  屏蔽mouseMove里往postions添加时 未创建点
            } else {
                point.wz = $this.positions.length; // 点对应的在positions中的位置
            }
            $this.pointArr.push(point);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((evt) => { // 移动时绘制面
            if ($this.positions.length < 2) { return; }
            // var ray = viewer.camera.getPickRay(evt.endPosition);
            // if (!ray) return;
            // var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
            let cartesian;
            cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
            if (!cartesian) { return; }
            $this.floatPoint.position.setValue(cartesian);
            if ($this.positions.length >= 2) {
                if (!Cesium.defined($this.arrowEntity)) {
                    $this.positions.push(cartesian);
                    $this.arrowEntity = $this.showArrowOnMap($this.positions);
                    $this.arrowEntity.objId = $this.objId;
                } else {
                    $this.positions.pop();
                    $this.positions.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction((evt) => { // 右击结束绘制
            // var ray = viewer.camera.getPickRay(evt.position);
            // if (!ray) return;
            // var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
            let cartesian;
            cartesian = getCatesian3FromPX(evt.position, $this.viewer);
            if (!cartesian) { return; }
            // tslint:disable-next-line: no-shadowed-variable
            for (const point of $this.pointArr) {
                point.show = false;
            }
            $this.floatPoint.show = false;
            $this.viewer.entities.remove($this.floatPoint);
            $this.floatPoint = null;
            const point = $this.creatPoint(cartesian);
            point.show = false;
            point.wz = $this.positions.length;
            $this.pointArr.push(point);
            $this.handler.destroy();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    createByData(data) { // 根据传入的数据构建箭头
        this.positions = []; // 控制点
        this.state = -1; // state用于区分当前的状态 0 为删除 1为添加 2为编辑
        this.floatPoint = null;
        this.pointArr = []; // 中间各点
        this.selectPoint = null;
        this.clickStep = 0; // 用于控制点的移动结束
        this.modifyHandler = null;
        const arr = [];
        for (const d of data) {
            const cart3 = Cesium.Cartesian3.fromDegrees(d[0], d[1]);
            arr.push(cart3);
        }
        this.positions = arr;
        // 构建控制点
        for (let i = 0; i < this.positions.length; i++) {
            const point = this.creatPoint(this.positions[i]);
            point.show = false;
            point.wz = i + 1;
            this.pointArr.push(point);
        }
        this.arrowEntity = this.showArrowOnMap(this.positions);
        this.arrowEntity.objId = this.objId;
    }

    startModify() { // 修改箭头
        this.state = 2;
        const $this = this;
        for (const point of $this.pointArr) {
            point.show = true;
        }
        if (!this.modifyHandler) { this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas); }
        this.modifyHandler.setInputAction((evt) => { // 单机开始绘制
            const pick = $this.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                $this.clickStep++;
                if (!pick.id.objId) {
                    $this.selectPoint = pick.id;
                }
            } else { // 激活移动点之后 单机面之外 移除这个事件
                for (const point of $this.pointArr) {
                    point.show = false;
                }
                if ($this.floatPoint) { $this.floatPoint.show = false; }
                $this.state = -1;
                $this.modifyHandler.destroy();
                $this.modifyHandler = null;
            }
            if ($this.clickStep === 2) {
                $this.clickStep = 0;
                // var ray = $this.viewer.camera.getPickRay(evt.position);
                // if (!ray) return;
                // var cartesian = $this.viewer.scene.globe.pick(ray, $this.viewer.scene);
                let cartesian;
                cartesian = getCatesian3FromPX(evt.position, $this.viewer);
                if (!cartesian) { return; }
                if ($this.selectPoint) {
                    $this.selectPoint.position.setValue(cartesian);
                    $this.selectPoint = null;
                }

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.modifyHandler.setInputAction((evt) => { // 单机开始绘制
            // var ray = $this.viewer.camera.getPickRay(evt.endPosition);
            // if (!ray) return;
            // var cartesian = $this.viewer.scene.globe.pick(ray, $this.viewer.scene);
            let cartesian;
            cartesian = getCatesian3FromPX(evt.endPosition, $this.viewer);
            if (!cartesian) { return; }
            if ($this.selectPoint) {
                $this.selectPoint.position.setValue(cartesian);
                $this.positions[$this.selectPoint.wz - 1] = cartesian; // 上方的wz用于此处辨识修改positions数组里的哪个元素
            } else {
                return;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    clear() { // 清除绘制箭头
        this.state = 0;
        for (const point of this.pointArr) {
            if (point) { this.viewer.entities.remove(point); }
        }
        if (this.floatPoint) { this.viewer.entities.remove(this.floatPoint); }
        if (this.arrowEntity) { this.viewer.entities.remove(this.arrowEntity); }
        this.state = -1;
    }

    getLnglats() {
        const arr = [];
        for (const position of this.positions) {
            const item = this.cartesianToLatlng(position);
            arr.push(item);
        }
        return arr;
    }

    getPositions() { // 获取直角箭头中的控制点 世界坐标
        return this.positions;
    }

    creatPoint(cartesian) {
        const point = this.viewer.entities.add({
            position: cartesian,
            billboard: {
                image: this.pointImageUrl,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            }
        });
        point.attr = 'editPoint';
        return point;
    }

    showArrowOnMap(positions) {
        const update = () => {
            // 计算面
            if (positions.length < 3) {
                return null;
            }
            const lnglatArr = [];
            for (const position of positions) {
                const lnglat = this.cartesianToLatlng(position);
                lnglatArr.push(lnglat);
            }
            const res = alg.algorithm.tailedAttackArrow(lnglatArr);
            const index = JSON.stringify(res.polygonalPoint).indexOf('null');
            let returnData = [];
            if (index === -1) { returnData = res.polygonalPoint; }
            return new Cesium.PolygonHierarchy(returnData);
        };
        return this.viewer.entities.add({
            polygon: new Cesium.PolygonGraphics({
                hierarchy: new Cesium.CallbackProperty(update, false),
                show: true,
                fill: true,
                material: this.fillMaterial
            })
        });
    }

    cartesianToLatlng(cartesian) {
        const latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        const lat = Cesium.Math.toDegrees(latlng.latitude);
        const lng = Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }

}


function getCatesian3FromPX(px, viewer) {
    const picks = viewer.scene.drillPick(px);
    viewer.render();
    let cartesian;
    let isOn3dtiles = true;
    for (const pick of picks) {
        if ((pick && pick.primitive) || pick instanceof Cesium.Cesium3DTileFeature) { // 模型上拾取
            isOn3dtiles = true;
        }
    }
    if (isOn3dtiles) {
        cartesian = viewer.scene.pickPosition(px);
    } else {
        const ray = viewer.camera.getPickRay(px);
        if (!ray) { return null; }
        cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    }
    return cartesian;
}


