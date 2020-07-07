
export class EagleDisplay {
  private originViewer: any;
  private imageryProvider: any;
  private mapContainer: HTMLDivElement;
  private className = "eagle-display-container";
  private containerId: string;
  private eagleViewer: any;
  private boxWidth = 200;
  private boxHeight = 150;
  private eagleRect: any;
  private cacheBound: any;
  constructor(options: EagleDisplayOptions) {
    this.originViewer = options.viewer;
    if (options.className) {
      this.className = `${options.className} ${this.className}`;
    }
    if (options.imageryProvider) {
      this.imageryProvider = options.imageryProvider;
    }
    this.containerId = `eagle-display-${Math.random()
      .toString(36)
      .substr(2)}`;
    this.addEagleContainer();
    this.initEagleMap();
    this.addViewerChangeListen();
  }

  private addEagleContainer() {
    const preContainer = this.originViewer.container as HTMLElement;
    if (!preContainer.style.position) {
      preContainer.style.position = "relative";
    }
    this.mapContainer = window.document.createElement("div");
    this.mapContainer.setAttribute("id", this.containerId);
    this.mapContainer.setAttribute("class", this.className);
    preContainer.appendChild(this.mapContainer);
  }

  private initEagleMap() {
    this.eagleViewer = new Cesium.Viewer(this.containerId, {
      sceneMode: Cesium.SceneMode.SCENE2D,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      skyAtmosphere: false,
      shadows: false,
      shouldAnimate: false,
      imageryProvider: this.imageryProvider || null
    });
    let control = this.eagleViewer.scene.screenSpaceCameraController;
    control.enableRotate = false;
    control.enableTranslate = false;
    control.enableZoom = false;
    control.enableTilt = false;
    control.enableLook = false;
  }

  private syncEagleViewer() {
    let viewBound: any = this.originViewer.camera.computeViewRectangle();
    if (this.cacheBound && Cesium.Rectangle.equals(viewBound, this.cacheBound)) {
      return;
    }
    this.cacheBound = viewBound;
    let center = Cesium.Rectangle.center(viewBound);
    const width = Cesium.Rectangle.computeWidth(viewBound);
    const height = Cesium.Rectangle.computeHeight(viewBound);
    const eagleBound = this.getEagleBound(center, width, height);
    this.drawEagleBound(viewBound);
    this.eagleViewer.camera.flyTo({
      destination: eagleBound,
      duration: 0.0
    });
  }

  private getEagleBound(center: any, width: number, height: number) {
    let west = center.longitude;
    let south = center.latitude;
    let east = center.longitude;
    let north = center.latitude;
    const aspectRatio = this.boxWidth / this.boxHeight;
    const viewRatio = width / height;
    if (aspectRatio > viewRatio) {
      south -= height;
      north += height;
      const diffx = height * aspectRatio;
      west -= diffx;
      east += diffx;
    } else {
      west -= width;
      east += width;
      const diffy = width / aspectRatio;
      south -= diffy;
      north += diffy;
    }
    if (south < -Math.PI / 2) {
      south = Math.PI / 2;
    }
    if (north > Math.PI / 2) {
      north = Math.PI / 2;
    }
    if (west < -Math.PI) {
      west = Math.PI + (west + Math.PI);
    }
    if (east > Math.PI) {
      east = -Math.PI + east - Math.PI;
    }
    if (height > Math.PI) {
      north = Math.PI / 2;
      south = -Math.PI / 2;
    }
    if (width > 2 * Math.PI) {
      west = -Math.PI;
      east = Math.PI;
    }

    return Cesium.Rectangle.fromRadians(
      west,
      south,
      east,
      north,
      new Cesium.Rectangle()
    );
  }

  private drawEagleBound(rect: any) {
    const rectg = new Cesium.RectangleGraphics({
      coordinates: new Cesium.ConstantProperty(rect),
      material: new Cesium.ColorMaterialProperty(Cesium.Color.ORANGE.withAlpha(0.4))
    });
    const rectEntity = new Cesium.Entity({
      id:
        "eagle-display-bound-" +
        Math.random()
          .toString(36)
          .substr(2),
      rectangle: rectg
    });
    if (this.eagleRect) {
      this.eagleViewer.entities.removeById(this.eagleRect.id);
    }
    this.eagleRect = this.eagleViewer.entities.add(rectEntity);
  }

  private addViewerChangeListen() {
    this.originViewer.scene.preRender.addEventListener(() => {
      this.syncEagleViewer();
    });
  }
}

export interface EagleDisplayOptions {
  viewer: any;
  className?: string;
  imageryProvider?: any;
}
