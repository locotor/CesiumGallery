import { HeatmapProvider, HeatmapData } from './Imagery/provider/HeatmapProvider';
import { HeatmapConfiguration } from 'heatmap.js';

export class ZmHeatmap {
  private layer: any;
  private provider: any;
  private config: HeatmapConfiguration;
  private hdata: HeatmapData;
  private containerId: string;
  private scene: any;

  constructor(viewer: any, config: HeatmapConfiguration, data: HeatmapData) {
    this.containerId = 'zm-heatmap-' + Math.random().toString(32).substr(2);
    this.scene = viewer.scene;
    const bon = this.getBounds(this.scene.camera);
    this.hdata = data;
    this.config = config;
    this.provider = new HeatmapProvider({
      id: this.containerId,
      bounds: bon,
      data,
      heatmapoptions: config
    });
    this.layer = this.scene.imageryLayers.addImageryProvider(this.provider);
    this.scene.camera.moveEnd.addEventListener(this.updateHeatmap, this);
  }

  getBounds(camera: any) {
    const rectangle = camera.computeViewRectangle();
    const west = rectangle.west / Math.PI * 180;
    const north = rectangle.north / Math.PI * 180;
    const east = rectangle.east / Math.PI * 180;
    const south = rectangle.south / Math.PI * 180;
    return {
      west,
      north,
      east,
      south
    };
  }

  private updateHeatmap() {
    const bounds = this.getBounds(this.scene.camera);
    const provider = new HeatmapProvider({
      id: this.containerId,
      bounds,
      data: this.hdata,
      heatmapoptions: this.config
    });
    this.scene.imageryLayers.remove(this.layer);
    this.layer = this.scene.imageryLayers.addImageryProvider(provider);
    this.provider = provider;
  }

  removeLayer() {
    this.scene.imageryLayers.remove(this.layer);
    this.scene.camera.moveEnd.removeEventListener(this.updateHeatmap, this);
  }
}
