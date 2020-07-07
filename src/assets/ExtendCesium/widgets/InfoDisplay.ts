import { RegPropOption, EntityRegMsgOption, FloatBoxStyleOption, InfoBoxStyleOption } from './../models/options';
import { Subject, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export default class InfoDisplay {

  // 用以向外传递状态以及数据
  subject: Subject<any>;

  private viewer: any;
  private scene: any;
  private camera: any;
  // infoBox相关
  private infoHandler: any;
  private infoBoxContainerDiv;
  private infoBoxMap: Map<string, any> = new Map(); // 存储infoBox实体对应的dom节点。key值为id，value为dom节点，entity实体
  private regisInfoBoxMap: Map<string, EntityRegMsgOption> = new Map(); // 存储实体注册信息。key值为id，value为dom的文字内容、entity实体、box模板key
  private infoBoxTemplateMap: Map<string, InfoBoxStyleOption> = new Map(); // 存储自定义的infoBox模板
  // floatBox相关
  private floatHandler: any;
  private floatBoxContainerDiv;
  // private floatBoxDiv: any; // 存储单独的一个floatBox的dom节点
  private floatBoxMap: Map<string, any> = new Map(); // 存储floatBox实体对应的dom节点，key值为 template 名称，value：dom节点
  private regisFloatBoxMap: Map<string, EntityRegMsgOption> = new Map(); // 存储实体注册信息。key值为id，value为dom的文字内容、entity实体、box模板key
  private floatBoxTemplateMap: Map<string, FloatBoxStyleOption> = new Map(); // 存储自定义的floatBox模板

  constructor(viewer) {
    this.viewer = viewer;
    this.scene = this.viewer.scene;
    this.camera = this.scene.camera;
    this.infoHandler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
    this.floatHandler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
    this.subject = new Subject<any>();
    this.initBoxContainer();
    this.bindBoxEvent();
    this.scene.postRender.addEventListener(() => {
      this.refreshInfoBoxIndex();
    });
  }

  private initBoxContainer() {
    const infoContainer = document.createElement('div');
    const floatContainer = document.createElement('div');
    this.scene.canvas.parentElement.appendChild(infoContainer);
    this.scene.canvas.parentElement.appendChild(floatContainer);
    this.infoBoxContainerDiv = infoContainer;
    this.floatBoxContainerDiv = floatContainer;
  }

  private bindBoxEvent() {
    // infoBox相关事件绑定
    this.infoHandler.setInputAction(movement => {
      const picObj = this.scene.pick(movement.endPosition);
      if (picObj) {
        // 判断实体是否注册infoBox，注册才显示pointer
        const prop = this.regisInfoBoxMap.get(picObj.id.id);
        if (!prop) { return; }
        this.scene.canvas.style.cursor = 'pointer';
      } else {
        this.scene.canvas.style.cursor = 'auto';
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.infoHandler.setInputAction(movement => {
      const picObj = this.scene.pick(movement.position);
      if (picObj) {
        const prop = this.regisInfoBoxMap.get(picObj.id.id);
        if (!prop) { return; }
        this.createInfoBox(prop, movement.position);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 监听点击，叉掉infoBox
    fromEvent(this.infoBoxContainerDiv, 'click').pipe(
      filter((event: any) => event.target.className === 'dis-close'),
      map((event: any) => event.target.parentElement),
    ).subscribe(el => {
      // console.log(el, 'dd');
      this.removeInfoBox(el.getAttribute('name'));
    });
    // floatBox相关事件绑定
    this.floatHandler.setInputAction(movement => {
      const picObj = this.scene.pick(movement.endPosition);
      if (picObj) {
        const prop = this.regisFloatBoxMap.get(picObj.id.id);
        if (!prop) { return; }
        this.scene.canvas.style.cursor = 'pointer';
        this.refreshFloatBox(prop, movement.endPosition);
      } else {
        this.scene.canvas.style.cursor = 'auto';
        this.hideFloatBox();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 注册信息框
  // 传入实体和属性
  regInfoBox(entity, prop: RegPropOption = {}) {
    const title = prop.title || entity.name || entity.id;
    const content = prop.content || '';
    const template = prop.template || 'default';
    this.regisInfoBoxMap.set(entity.id, { title, content, template, entity });
  }

  // 注销信息框注册
  logOffInfoBox(entityId: string) {
    this.regisInfoBoxMap.delete(entityId);
  }

  /**
   * @param key template对应的key值
   * @param style 传入一个<style></style>的字符串，可定制 .info-box，.info-title，.info-content这三个类的样式
   */
  addInfoBoxTemplateStyle(key: string, style: InfoBoxStyleOption) {
    this.infoBoxTemplateMap.set(key, style);
  }

  /**
   * 1.点击
   * 2.生成一个完整实体对象并存储（存储在dom，map中）
   * 3.消除（从dom中消除，从map中消除）
   */
  private createInfoBox(prop: EntityRegMsgOption, cartesian2) {
    let infoBox = this.infoBoxMap.get(prop.entity.id);
    let infoBoxDiv = null;
    if (!infoBox) {
      infoBoxDiv = this.generateInfoBoxDiv(prop.template);
      infoBoxDiv.setAttribute('name', prop.entity.id);
      this.infoBoxContainerDiv.appendChild(infoBoxDiv);
      const titleDiv = infoBoxDiv.querySelector('.info-title');
      const contentDiv = infoBoxDiv.querySelector('.info-content');
      titleDiv.textContent = prop.title;
      contentDiv.textContent = prop.content;
    } else {
      infoBoxDiv = infoBox.node;
    }
    const cartesian3 = this.scene.pickPosition(cartesian2);
    const screen = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.scene, cartesian3);
    infoBoxDiv.style.left = screen.x + 10 + 'px';
    infoBoxDiv.style.top = screen.y + 10 + 'px';
    infoBoxDiv.style.position = 'absolute';
    infoBoxDiv.style.visibility = 'visible';
    infoBox = { node: infoBoxDiv, cartesian3 };
    this.infoBoxMap.set(prop.entity.id, infoBox);
  }

  removeInfoBox(id: string) {
    const infoBox = this.infoBoxMap.get(id);
    this.infoBoxMap.delete(id);
    this.infoBoxContainerDiv.removeChild(infoBox.node);
  }

  clearInfoBox() {
    this.infoBoxMap.forEach((infoBox, name) => {
      this.removeInfoBox(name);
    });
  }

  // 从模板创建floatBox的dom
  private generateInfoBoxDiv(key: string) {
    // dom 元素创建
    const infoBoxDiv = document.createElement('div');
    const infoTitleDiv = document.createElement('div');
    const infoContentDiv = document.createElement('div');
    const infoCloseDiv = document.createElement('div'); // 叉掉
    infoBoxDiv.setAttribute('class', 'info-box');
    infoTitleDiv.setAttribute('class', 'info-title');
    infoContentDiv.setAttribute('class', 'info-content');
    infoCloseDiv.setAttribute('class', 'dis-close');
    infoBoxDiv.appendChild(infoTitleDiv);
    infoBoxDiv.appendChild(infoContentDiv);
    infoBoxDiv.appendChild(infoCloseDiv);
    infoCloseDiv.textContent = '×';
    // style 赋予
    const style: InfoBoxStyleOption = this.infoBoxTemplateMap.get(key) || {
      infoBox: {
        width: '300px',
        height: 'fit-content',
        border: '1px solid black',
        'border-radius': '10px',
      },
      infoTitle: {
        width: '100%',
        padding: '5px 0',
        height: '20px',
        'border-bottom': '1px solid black',
        display: 'flex',
        'justify-content': 'center',
        'align-items': 'center',
        'background-color': 'skyblue',
        'border-radius': '10px 10px 0 0',
        position: 'relative',
        'box-sizing': 'content-box'
      },
      infoContent: {
        width: '100%',
        padding: '5px',
        'text-indent': '32px',
        'overflow-wrap': 'break-word',
        'background-color': 'rgb(224, 255, 254)',
        'border-radius': '0 0 10px 10px'
      },
    };
    const infoBoxStyle = this.transStyleFromObjToStr(style.infoBox);
    const infoTitleStyle = this.transStyleFromObjToStr(style.infoTitle);
    const infoContentStyle = this.transStyleFromObjToStr(style.infoContent);
    const closeStyle = this.transStyleFromObjToStr({
      position: 'absolute',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      right: '10px',
      top: '10px',
      width: '10px',
      height: '10px',
      'box-sizing': 'content-box',
      cursor: 'pointer',
      'font-size': '20px',
      'font-weight': '700'
    });
    infoBoxDiv.setAttribute('style', infoBoxStyle);
    infoTitleDiv.setAttribute('style', infoTitleStyle);
    infoContentDiv.setAttribute('style', infoContentStyle);
    infoCloseDiv.setAttribute('style', closeStyle);
    return infoBoxDiv;
  }

  private refreshInfoBoxIndex() {
    this.infoBoxMap.forEach(infoBox => {
      const cartesian3 = infoBox.cartesian3;
      const infoBoxDiv: HTMLDivElement = infoBox.node;
      const cartesian2 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.scene, cartesian3);
      infoBoxDiv.style.left = cartesian2.x + 'px';
      infoBoxDiv.style.top = cartesian2.y + 'px';
    });
  }

  /**
   * 浮动窗每个模板有对应的一个dom实体，根据情况隐藏以及更改内部信息数据。
   */
  // 注册浮动窗
  regFloatBox(entity, prop: RegPropOption = {}) {
    // console.log(entity);
    const title = prop.title || entity.name || entity.id;
    const content = prop.content || '';
    const template = prop.template || 'default';
    this.regisFloatBoxMap.set(entity.id, { title, content, entity, template });
  }

  // 注销浮动窗注册
  logOffFloatBox(entityId) {
    this.regisFloatBoxMap.delete(entityId);
  }

  /**
   * @param key template对应的key值
   * @param style 传入一个<style></style>的字符串，可定制 .float-box，.float-title，.float-content这三个类的样式
   */
  addFloatBoxTemplateStyle(key: string, style: FloatBoxStyleOption) {
    this.floatBoxTemplateMap.set(key, style);
  }

  // 刷新浮动窗位置状态
  private refreshFloatBox(prop: EntityRegMsgOption, cartesian2) {
    if (!this.floatBoxMap.get(prop.template)) {
      const tempFloatBoxDiv = this.generateFloatBoxDiv(prop.template);
      this.floatBoxMap.set(prop.template, tempFloatBoxDiv);
      this.floatBoxContainerDiv.appendChild(tempFloatBoxDiv);
    }
    const floatBoxDiv = this.floatBoxMap.get(prop.template);
    // console.log(prop.template);
    // console.log(floatBoxDiv);
    const titleDiv = floatBoxDiv.querySelector('.float-title');
    const contentDiv = floatBoxDiv.querySelector('.float-content');
    // 更新浮动框内容信息
    if (titleDiv.getAttribute('name') !== prop.entity.id) {
      titleDiv.setAttribute('name', prop.entity.id);
      titleDiv.textContent = prop.title;
      contentDiv.textContent = prop.content;
    }
    const cartesian3 = this.scene.pickPosition(cartesian2);
    const screen = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.scene, cartesian3);
    floatBoxDiv.style.left = screen.x + 10 + 'px';
    floatBoxDiv.style.top = screen.y + 10 + 'px';
    floatBoxDiv.style.position = 'absolute';
    floatBoxDiv.style.visibility = 'visible';
  }

  // 从模板创建floatBox的dom
  private generateFloatBoxDiv(key: string) {
    // dom 元素创建
    const floatBoxDiv = document.createElement('div');
    const floatTitleDiv = document.createElement('div');
    const floatContentDiv = document.createElement('div');
    floatBoxDiv.setAttribute('class', 'float-box');
    floatTitleDiv.setAttribute('class', 'float-title');
    floatContentDiv.setAttribute('class', 'float-content');
    floatBoxDiv.appendChild(floatTitleDiv);
    floatBoxDiv.appendChild(floatContentDiv);
    // style 赋予
    const style: FloatBoxStyleOption = this.floatBoxTemplateMap.get(key) || {
      floatBox: {
        width: '300px',
        height: 'fit-content',
        border: '1px solid black',
        'border-radius': '10px',
        'pointer-events': 'none'
      },
      floatTitle: {
        width: '100%',
        padding: '5px 0',
        height: '20px',
        'border-bottom': '1px solid black',
        display: 'flex',
        'justify-content': 'center',
        'align-items': 'center',
        'background-color': 'skyblue',
        'border-radius': '10px 10px 0 0',
        position: 'relative',
        'box-sizing': 'content-box'
      },
      floatContent: {
        width: '100%',
        padding: '5px',
        'text-indent': '32px',
        'overflow-wrap': 'break-word',
        'background-color': 'rgb(224, 255, 254)',
        'border-radius': '0 0 10px 10px'
      },
    };
    const floatBoxStyle = this.transStyleFromObjToStr(style.floatBox);
    const floatTitleStyle = this.transStyleFromObjToStr(style.floatTitle);
    const floatContentStyle = this.transStyleFromObjToStr(style.floatContent);
    floatBoxDiv.setAttribute('style', floatBoxStyle);
    floatTitleDiv.setAttribute('style', floatTitleStyle);
    floatContentDiv.setAttribute('style', floatContentStyle);
    return floatBoxDiv;
  }

  // style 从对象转化为字符串
  transStyleFromObjToStr(obj: object) {
    const str = JSON.stringify(obj);
    return str.replace(/",/g, ';').replace(/({|}|")/g, '');
  }

  // 隐藏dom内容
  private hideFloatBox() {
    this.floatBoxMap.forEach(dom => {
      dom.style.visibility = 'hidden';
    });
  }

}
