import { HeatmapConfiguration, Heatmap } from 'heatmap.js';

declare var h337: any;


export class HeatmapProvider {
  private mcredit: any;
  get credit() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('HeatmapProvider:credit must not be called before the imagery provider is ready.');
    }
    return this.mcredit;
  }

  private mready: boolean;
  get ready() {
    return this.mready;
  }

  private height: number;
  private width: number;
  private currentLevel: number;

  defaultAlpha: number;
  defaultBrightness: number;
  defaultContrast: number;
  defaultGamma: number;
  defaultHue: number;
  defaultSaturation: number;
  defaultMagnificationFilter: any;
  defaultMinificationFilter: any;
  private merrorEvent: any;
  readonly mhasAlphaChannel: boolean;
  get hasAlphaChannel() {
    return true;
  }
  readonly url = '';


  readonly maximumLevel: number = 0;
  readonly minimumLevel: number = 0;
  proxy: any;
  readyPromise: Promise<boolean>;

  private mtileWidth: number;
  get tileWidth() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('HeatmapProvider:tileWidth must not be called before the imagery provider is ready.');
    }
    return this.mtileWidth;
  }

  private mtileHeight: number;

  get tileHeight() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('HeatmapProvider:tileHeight must not be called before the imagery provider is ready.');
    }
    return this.mtileHeight;
  }
  private mtilingScheme: any;
  get tilingScheme() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('HeatmapProvider:mtilingScheme must not be called before the imagery provider is ready.');
    }
    return this.mtilingScheme;
  }


  get tileDiscardPolicy() {
    if (!this.mready) {
      throw new Cesium.DeveloperError('HeatmapProvider:tileDiscardPolicy must not be called before the imagery provider is ready.');
    }

    return undefined;
  }


  get rectangle() {
    return this.mtilingScheme.rectangle;
  }


  get errorEvent() {
    return this.merrorEvent;
  }


  private mwmp: any;
  private mbounds: Bounds;
  private bounds: Bounds;
  private hoptions: HeatmapConfiguration;
  private spacing: number;
  private factor: number;
  private xoffset: number;
  private yoffset: number;
  private container: HTMLDivElement;
  private heatmap: Heatmap<string, string, string>;
  private canvas: HTMLCanvasElement;
  private image: HTMLCanvasElement;
  private texture: any;

  constructor(options: HeatmapImageryOptions) {
    console.log(options);
    let credit = options.credit;
    if (typeof credit === 'string') {
      credit = new Cesium.Credit(credit);
    }
    this.mcredit = (credit) || new Cesium.Credit('');
    const bounds = options.bounds;

    this.mwmp = new Cesium.WebMercatorProjection();
    this.mbounds = this.wgs84ToMercatorBB(bounds);
    this.hoptions = options.heatmapoptions || { container: null };
    this.hoptions.gradient = this.hoptions.gradient || {
      0.25: 'rgb(0,0,255)',
      0.55: 'rgb(0,255,0)',
      0.85: 'yellow',
      1.0: 'rgb(255,0,0)'
    };

    this.setWidthAndHeight(this.mbounds);
    this.hoptions.radius = this.hoptions.radius || ((this.width > this.height) ? this.width / 60 : this.height / 60);

    this.spacing = this.hoptions.radius * 1.5;
    this.xoffset = this.mbounds.west;
    this.yoffset = this.mbounds.south;

    this.width = Math.round(this.width + this.spacing * 2);
    this.height = Math.round(this.height + this.spacing * 2);

    this.mbounds.west -= this.spacing * this.factor;
    this.mbounds.east += this.spacing * this.factor;
    this.mbounds.south -= this.spacing * this.factor;
    this.mbounds.north += this.spacing * this.factor;

    this.bounds = this.mercatorToWgs84BB(this.mbounds);

    this.container = this.getContainer(this.width, this.height, options.id);
    this.hoptions.container = this.container;
    this.heatmap = h337.create(this.hoptions);
    this.canvas = this.container.children[0] as HTMLCanvasElement;

    this.mtilingScheme = new Cesium.WebMercatorTilingScheme({
      rectangleSouthwestInMeters: new Cesium.Cartesian2(this.mbounds.west, this.mbounds.south),
      rectangleNortheastInMeters: new Cesium.Cartesian2(this.mbounds.east, this.mbounds.north)
    });
    console.log(this.mtilingScheme);

    this.image = this.canvas;
    this.texture = undefined;
    this.mtileWidth = this.width;
    this.mtileHeight = this.height;
    this.mready = false;

    this.mready = this.setWGS84Data(options.data.min, options.data.max, options.data.points);
    this.readyPromise = new Promise(resolve => {
      resolve(true);
    });
  }

  getContainer(width: number, height: number, id?: string) {
    const con = document.querySelector(`#${id}`);
    if (con) {
      document.body.removeChild(con);
    }
    const c = document.createElement('div');
    if (id) { c.setAttribute('id', id); }
    c.setAttribute('style', 'width: ' + width + 'px; height: ' + height + 'px; margin: 0px; display: none;');
    document.body.appendChild(c);
    return c;
  }

  /**
   * Convert a WGS84 bounding box into a Mercator bounding box.
   */
  private wgs84ToMercatorBB(bounds: any) {
    const ne = this.mwmp.project(Cesium.Cartographic.fromDegrees(bounds.east, bounds.north));
    const sw = this.mwmp.project(Cesium.Cartographic.fromDegrees(bounds.west, bounds.south));
    return {
      north: ne.y,
      south: sw.y,
      east: ne.x,
      west: sw.x
    };
  }

  private setWidthAndHeight(mbb: Bounds) {
    const maxCanvasSize = 2000;
    const minCanvasSize = 700;
    this.width = ((mbb.east > 0 && mbb.west < 0) ? mbb.east + Math.abs(mbb.west) : Math.abs(mbb.east - mbb.west));
    this.height = ((mbb.north > 0 && mbb.south < 0) ? mbb.north + Math.abs(mbb.south) : Math.abs(mbb.north - mbb.south));
    this.factor = 1;

    if (this.width > this.height && this.width > maxCanvasSize) {
      this.factor = this.width / maxCanvasSize;

      if (this.height / this.factor < minCanvasSize) {
        this.factor = this.height / minCanvasSize;
      }
    } else if (this.height > this.width && this.height > maxCanvasSize) {
      this.factor = this.height / maxCanvasSize;

      if (this.width / this.factor < minCanvasSize) {
        this.factor = this.width / minCanvasSize;
      }
    } else if (this.width < this.height && this.width < minCanvasSize) {
      this.factor = this.width / minCanvasSize;

      if (this.height / this.factor > maxCanvasSize) {
        this.factor = this.height / maxCanvasSize;
      }
    } else if (this.height < this.width && this.height < minCanvasSize) {
      this.factor = this.height / minCanvasSize;

      if (this.width / this.factor > maxCanvasSize) {
        this.factor = this.width / maxCanvasSize;
      }
    }

    this.width = this.width / this.factor;
    this.height = this.height / this.factor;
  }

  /**
   * Convert a Mercator bounding box into a WGS84 bounding box.
   */
  private mercatorToWgs84BB(bounds: Bounds) {
    const sw = this.mwmp.unproject(new Cesium.Cartesian3(bounds.west, bounds.south));
    const ne = this.mwmp.unproject(new Cesium.Cartesian3(bounds.east, bounds.north));
    return {
      north: this.rad2deg(ne.latitude),
      east: this.rad2deg(ne.longitude),
      south: this.rad2deg(sw.latitude),
      west: this.rad2deg(sw.longitude)
    };
  }

  /**
   * Convert radians into degrees.
   */
  private rad2deg(radians: number) {
    return (radians / (Math.PI / 180.0));
  }

  /**
   * Set an array of WGS84 locations.
   */
  private setWGS84Data(min: number, max: number, data: Point[]) {
    if (data && data.length > 0) {
      const convdata = data.map(gp => {
        const hp = this.wgs84PointToHeatmapPoint(gp);
        if (gp.value || gp.value === 0) { hp.value = gp.value || 1; }
        return hp;
      });
      console.log(convdata);
      return this.setData(min, max, convdata);
    }

    return false;
  }

  /**
   * Convert a WGS84 location to the corresponding heatmap location.
   */
  private wgs84PointToHeatmapPoint(point: any) {
    return this.mercatorPointToHeatmapPoint(this.wgs84ToMercator(point));
  }

  /**
   * Convert a mercator location to the corresponding heatmap location.
   */
  private mercatorPointToHeatmapPoint(point: any) {
    const pn: any = {};
    pn.x = Math.round((point.x - this.xoffset) / this.factor + this.spacing);
    pn.y = Math.round((point.y - this.yoffset) / this.factor + this.spacing);
    pn.y = this.height - pn.y;
    return pn;
  }

  /**
   * Convert a WGS84 location into a Mercator location.
   */
  private wgs84ToMercator(point: any) {
    return this.mwmp.project(Cesium.Cartographic.fromDegrees(point.x, point.y));
  }

  /**
   * Set an array of heatmap locations.
   */
  private setData(min: number, max: number, data: any) {
    if (data && data.length > 0) {
      this.heatmap.setData({
        min,
        max,
        data
      });
      return true;
    }

    return false;
  }

  getTileCredits(x: number, y: number, level: number): any[] {
    return [this.credit];
  }
  requestImage(x: number, y: number, level: number): Promise<HTMLImageElement | HTMLCanvasElement> {
    if (!this.mready) {
      throw new Cesium.DeveloperError('HeatmapProvider:requestImage must not be called before the imagery provider is ready.');
    }
    return new Promise(resolve => {
      resolve(this.image);
    });
  }
  pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<any[]> {
    return new Promise(resolve => {
      resolve([]);
    });
  }

}


interface HeatmapImageryOptions {
  id: string;
  bounds: Bounds;
  credit?: any;
  heatmapoptions?: HeatmapConfiguration;
  data: HeatmapData;
}

export interface HeatmapData {
  /*热力图最大值，默认为100*/
  max?: number;
  /*热力图最小值，默认为0*/
  min?: number;
  points: Array<Point>;
}

interface Point {
  x: number;
  y: number;
  /*点数据,默认为1*/
  value?: number;
}

interface Bounds {
  east: number;
  north: number;
  west: number;
  south: number;
}
