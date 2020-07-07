
export class LayerSplit {
  private viewer: any;
  private sliderClassName = "zm-slider-bar";
  private sliderBar: HTMLDivElement;
  private leftLayerProvider: any;
  private leftLayer: any;
  private moveActive = false;
  private handler: any;

  constructor(options: LayerSplitOptions) {
    this.viewer = options.viewer;
    if (options.sliderClassName) {
      this.sliderClassName = `${this.sliderClassName} ${options.sliderClassName}`;
    }
    this.leftLayerProvider = options.leftLayer;
    this.addLeftLayer();
    this.addSliderBar();
    this.addSliderAction();
  }

  /**
   * 将切分的图层添加到顶部
   */
  public raiseLayerToTop() {
    if (this.leftLayer) {
      this.viewer.imageryLayers.raiseToTop(this.leftLayer);
    }
  }

  /**
   * 切换左侧对比图层
   * @param layerProvider
   */
  public updateSplitLayer(layerProvider: any) {
    this.leftLayerProvider = layerProvider;
    this.addLeftLayer();
  }

  /**
   * 取消卷帘分析并移除对比图层
   */
  public destoryWithRemoveLayer() {
    this.removeSliderBar();
    if (this.leftLayer) {
      this.viewer.imageryLayers.remove(this.leftLayer);
    }
  }

  /**
   * 取消卷帘分析但是保留图层
   */
  public destoryWithRetainLayer(){
    this.removeSliderBar();
    this.viewer.scene.imagerySplitPosition=1.0;
    (this.leftLayer as any).splitDirection= Cesium.ImagerySplitDirection.NONE
  }

  private removeSliderBar(){
    const mapContainer = this.viewer.container as HTMLElement;
    if (this.handler) {
      this.handler.destroy();
    }
    if (this.sliderBar) {
      mapContainer.removeChild(this.sliderBar);
    }
  }

  private addSliderBar() {
    const mapContainer = this.viewer.container as HTMLElement;
    if (!mapContainer.style.position) {
      mapContainer.style.position = "relative";
    }

    this.sliderBar = document.createElement("div");
    this.sliderBar.setAttribute("class", this.sliderClassName);
    mapContainer.appendChild(this.sliderBar);
    this.viewer.scene.imagerySplitPosition =
      this.sliderBar.offsetLeft / this.sliderBar.parentElement.offsetWidth;
  }

  private addLeftLayer() {
    if (this.leftLayer) {
      this.viewer.imageryLayers.remove(this.leftLayer);
      this.leftLayer = null;
    }
    this.leftLayer = new Cesium.ImageryLayer(this.leftLayerProvider, {
      splitDirection: Cesium.ImagerySplitDirection.LEFT
    });
    this.viewer.imageryLayers.add(this.leftLayer);
  }

  private addSliderAction() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.sliderBar);

    this.handler.setInputAction(() => {
      this.moveActive = true;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.setInputAction(() => {
      this.moveActive = true;
    }, Cesium.ScreenSpaceEventType.PINCH_START);
    this.handler.setInputAction((movement: any) => {
      this.handlerMove(movement);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.setInputAction((movement: any) => {
      this.handlerMove(movement);
    }, Cesium.ScreenSpaceEventType.PINCH_MOVE);

    this.handler.setInputAction(() => {
      this.moveActive = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    this.handler.setInputAction(() => {
      this.moveActive = false;
    }, Cesium.ScreenSpaceEventType.PINCH_END);
  }

  handlerMove(movement: any) {
    if (!this.moveActive) {
      return;
    }
    var relativeOffset = movement.endPosition.x;
    var splitPosition =
      (this.sliderBar.offsetLeft + relativeOffset) /
      this.sliderBar.parentElement.offsetWidth;
    this.sliderBar.style.left = 100.0 * splitPosition + "%";
    this.viewer.scene.imagerySplitPosition = splitPosition;
  }
}

export interface LayerSplitOptions {
  viewer: any;
  sliderClassName?: string;
  leftLayer: any;
}
