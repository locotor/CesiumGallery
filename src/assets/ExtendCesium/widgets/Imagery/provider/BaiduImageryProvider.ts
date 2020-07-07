const VEC_URL = 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl';
const IMG_URL = 'http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46';
const CUSTOM_URL = 'http://api{s}.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid={style}';

// tslint:disable: variable-name
export default class BaiduImageryProvider {

  private _url: string;
  private _tileWidth = 256;
  private _tileHeight = 256;
  private _maximumLevel = 18;
  private _tilingScheme = new Cesium.WebMercatorTilingScheme({
    rectangleSouthwestInMeters: new Cesium.Cartesian2(-33554054, -33746824),
    rectangleNortheastInMeters: new Cesium.Cartesian2(33554054, 33746824)
  });
  private _rectangle = this._tilingScheme.rectangle;
  private _credit: any;
  private _style: any; // 这个style只对layer为custom的生效
  private _token: any;

  // layer分为vec,img,cus
  constructor(opts: any = {}) {
    switch (opts.style) {
      case 'vector': this._url = VEC_URL; break;
      case 'image': this._url = IMG_URL; break;
      default: this._url = CUSTOM_URL; this._style = opts.style || 'normal'; break;
    }
  }

  get url() {
    return this._url;
  }

  get token() {
    return this._token;
  }

  get tileWidth() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('tileWidth must not be called before the imagery provider is ready.');
    }
    return this._tileWidth;
  }

  get tileHeight() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('tileHeight must not be called before the imagery provider is ready.');
    }
    return this._tileHeight;
  }

  get maximumLevel() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('maximumLevel must not be called before the imagery provider is ready.');
    }
    return this._maximumLevel;
  }

  get minimumLevel() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('minimumLevel must not be called before the imagery provider is ready.');
    }
    return 0;
  }

  get tilingScheme() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('tilingScheme must not be called before the imagery provider is ready.');
    }
    return this._tilingScheme;
  }

  get rectangle() {
    if (!this.ready) {
      throw new Cesium.DeveloperError('rectangle must not be called before the imagery provider is ready.');
    }
    return this._rectangle;
  }

  get ready() {
    return !!this._url;
  }

  get credit() {
    return this._credit;
  }

  // getTileCredits(x, y, level) {}

  requestImage(x, y, level) {
    if (!this.ready) {
      throw new Cesium.DeveloperError('requestImage must not be called before the imagery provider is ready.');
    }
    const xTiles = this._tilingScheme.getNumberOfXTilesAtLevel(level);
    const yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);
    const url = this._url
      .replace('{x}', (x - xTiles / 2).toString())
      .replace('{y}', (yTiles / 2 - y - 1).toString())
      .replace('{z}', level)
      .replace('{s}', '1')
      .replace('{style}', this._style);
    return Cesium.ImageryProvider.loadImage(this, url);
  }
}
