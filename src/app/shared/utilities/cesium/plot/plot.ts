import * as Cesium from 'cesium';
import { StraightArrow, AttackArrow } from './arrow';

export class Plot {

    isActivate = false;
    drawArr = [];
    handler = null;
    viewer = null;
    nowArrowObj = null;

    init(viewer) {
        if (!this.isActivate) {
            this.isActivate = true;
            this.viewer = viewer;
            this.bindEdit();
        }
    }

    disable() {
        if (this.isActivate) {
            this.isActivate = false;
            for (const drawItem of this.drawArr) {
                drawItem.disable();
            }
            this.drawArr = [];
            if (this.handler) {
                this.handler.destroy();
                this.handler = null;
            }
            this.viewer = null;
        }
    }

    draw(type) {
        for (const drawItem of this.drawArr) {
            drawItem.disableHandler();
        }
        switch (type) {
            case 'straightArrow':
                const straightArrow = new StraightArrow(this.viewer);
                straightArrow.startDraw();
                this.drawArr.push(straightArrow);
                break;
            case 'attackArrow':
                const attackArrow = new AttackArrow(this.viewer);
                attackArrow.startDraw();
                this.drawArr.push(attackArrow);
                break;
            // tslint:disable-next-line: no-switch-case-fall-through
            default:
                break;
        }
    }

    // 保存用户数据
    saveData() {
        const jsonData = {
            straightArrowData: [],
            attackArrowData: [],
            pincerArrowData: []
        };
        for (const drawArrItem of this.drawArr) {
            const positions = drawArrItem.getLnglats();
            if (drawArrItem.type === 'StraightArrow') {
                jsonData.straightArrowData.push(positions);
            } else if (drawArrItem.type === 'AttackArrow') {
                jsonData.attackArrowData.push(positions);
            } else {
                jsonData.pincerArrowData.push(positions);
            }
        }
        console.log('保存的数据：' + JSON.stringify(jsonData));
    }

    // 展示用户保存的数据
    showData(jsonData) {
        if (!jsonData) { return; }
        const straightArrowArr = jsonData.straightArrowData;
        const attackArrowArr = jsonData.attackArrowData;
        const pincerArrowArr = jsonData.pincerArrowData;
        // 展示直线箭头
        for (const straightArrowItem of straightArrowArr) {
            const item = straightArrowItem;
            const straightArrow = new StraightArrow(this.viewer);
            straightArrow.createByData(item);
            this.drawArr.push(straightArrow);
        }
        // 展示攻击箭头
        for (const attackArrowItem of attackArrowArr) {
            const item = attackArrowItem;
            const attackArrow = new AttackArrow(this.viewer);
            attackArrow.createByData(item);
            this.drawArr.push(attackArrow);
        }

    }

    bindEdit() {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((evt) => { // 单机开始绘制
            const pick = this.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                if (this.nowArrowObj) {
                    if (this.nowArrowObj.state !== -1) {
                        console.log('上一步操作未结束，请继续完成上一步！');
                        return;
                    }
                }
                for (const drawArrItem of this.drawArr) {
                    if (pick.id.objId === drawArrItem.objId) {
                        this.nowArrowObj = drawArrItem;
                        drawArrItem.startModify();
                        break;
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    clearOne() {
        const $this = this;
        this.handler.setInputAction((evt) => { // 单机开始绘制
            const pick = this.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                for (let i = 0; i < $this.drawArr.length; i++) {
                    if (pick.id.objId === $this.drawArr[i].objId) {
                        $this.drawArr[i].clear();
                        $this.drawArr.splice(i, 1);
                        break;
                    }
                }
                $this.handler.destroy();
                $this.bindEdit();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    clearAll() {
        for (const drawArrItem of this.drawArr) {
            drawArrItem.clear();
        }
    }

}
