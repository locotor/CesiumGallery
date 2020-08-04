import * as Cesium from 'cesium';
import { CVT } from './utility';

enum GraphicType {
    POLYLINE,
    POLYGON,
    MARKER,
    LABEL,
    MODEL,
    POINT,
}

export class BaseGraphic {

    type: GraphicType;
    gvtype: any;
    gvid: string;
    gvname: string;
    name: string;
    attachment: any[];
    graphic: any;
    position: Cesium.Cartesian3 | number[];

    constructor(private viewer: Cesium.Viewer) { }

    flyTo() {
        if (this.graphic) {
            this.viewer.flyTo(this.graphic);
        }
    }

    coordinates() {
        if (this.position instanceof Cesium.Cartesian3) {
            const coor = CVT.cartesian2Degrees(this.position, this.viewer);
            return [coor.lon, coor.lat, coor.height];
        } else if (this.position instanceof Array) {
            const pts = [];
            for (const p of this.position) {
                const c = CVT.cartesian2Degrees(p, this.viewer);
                pts.push([c.lon, c.lat, c.height]);
            }
            if (this.type === GraphicType.POLYLINE) {
                return pts;
            } else {
                return [pts];
            }
        }
    }

    toGeoJson() {
        let geoJsonType = 'Point';
        switch (this.type) {
            case GraphicType.POLYGON:
                geoJsonType = 'Polygon';
                break;
            case GraphicType.POLYLINE:
                geoJsonType = 'LineString';
                break;
        }
        return {
            type: 'Feature',
            properties: { name: this.gvname, gvtype: this.gvtype },
            geometry:
            {
                type: geoJsonType,
                coordinates: this.coordinates()
            }
        };
    }

}
