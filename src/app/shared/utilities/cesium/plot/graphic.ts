import * as Cesium from 'cesium';
import { CVT } from './utility';

export enum GraphicType {
    POLYLINE,
    POLYGON,
    MARKER,
    LABEL,
    MODEL,
    POINT,
}

export class BaseGraphic {

    type: GraphicType;
    gvid: string;
    gvname: string;
    attachment: any[];
    graphic: Cesium.Entity | Cesium.Entity[];
    material: Cesium.MaterialProperty;
    nodePositions: Cesium.Cartesian3[];
    cesiumEntityOptions: Cesium.Entity.ConstructorOptions | Cesium.Entity.ConstructorOptions[];

    constructor(private viewer: Cesium.Viewer) { }

    flyTo() {
        if (this.graphic) {
            this.viewer.flyTo(this.graphic);
        }
    }

    coordinates() {
        if (this.nodePositions instanceof Cesium.Cartesian3) {
            const coor = CVT.cartesian2Degrees(this.nodePositions, this.viewer);
            return [coor.lon, coor.lat, coor.height];
        } else if (this.nodePositions instanceof Array) {
            const pts = [];
            for (const p of this.nodePositions) {
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
            properties: { name: this.gvname, type: this.type },
            geometry:
            {
                type: geoJsonType,
                coordinates: this.coordinates()
            }
        };
    }

    addNode(node: Cesium.Cartesian3) {
        this.nodePositions.push(node);
    }

}

export class CesiumPoint extends BaseGraphic {

    constructor(
        viewer: Cesium.Viewer,
        positions: Cesium.Cartesian3 | Cesium.Cartesian3[],
        pointOptions: Cesium.PointGraphics.ConstructorOptions
    ) {
        super(viewer);
        this.type = GraphicType.POINT;

        // only one point
        if (positions instanceof Cesium.Cartesian3) {
            this.cesiumEntityOptions = {
                position: positions,
                point: pointOptions
            };
        } // mutiple points
        else if (positions instanceof Array) {
            this.cesiumEntityOptions = [];
            for (const position of positions) {
                const point = {
                    position,
                    point: pointOptions
                };
                this.cesiumEntityOptions.push(point);
            }
        }
        if (this.cesiumEntityOptions instanceof Array) {
            this.graphic = this.cesiumEntityOptions.map(option => {
                const entity = viewer.entities.add(option);
                return entity;
            });
        } else {
            this.graphic = viewer.entities.add(this.cesiumEntityOptions);
        }
    }

}

export class CesiumPolyline extends BaseGraphic {

    readonly width: Cesium.Property;
    properties: Cesium.PropertyBag;
    nodePositions: Cesium.Cartesian3[];

    constructor(viewer: Cesium.Viewer, polylineOption: Cesium.PolylineGraphics.ConstructorOptions, properties?: any) {
        super(viewer);
        this.cesiumEntityOptions = {
            polyline: polylineOption,
            properties
        };
        this.cesiumEntityOptions.polyline.positions = new Cesium.CallbackProperty(() => this.nodePositions, false);
        this.type = GraphicType.POLYLINE;
        this.nodePositions = (polylineOption.positions as Cesium.Cartesian3[]) || [];
        // 添加 entity
        this.graphic = viewer.entities.add(this.cesiumEntityOptions);
        this.material = this.graphic.polyline.material;
        this.width = this.graphic.polyline.width;
        this.properties = this.graphic.properties;
    }

    addNode(node: Cesium.Cartesian3) {
        this.nodePositions.push(node);
    }

    popNode() {
        this.nodePositions.pop();
    }

    updateNode(index: number, node: Cesium.Cartesian3) {
        if (index < 0 || index > this.nodePositions.length - 1) {
            throw new Error('无效的index');
        }
        if (node instanceof Cesium.Cartesian3 === false) {
            throw new Error('无效的node');
        }
        this.nodePositions[index] = node;
    }

    dropNode(index: number) {
        this.nodePositions.splice(index, 1);
    }

    // Todo

}
