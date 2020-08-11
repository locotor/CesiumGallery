import { GraphicType, BaseGraphic } from './graphic';
import { graphicIdentity, CVT } from './utility';
import * as Cesium from 'cesium';


const LEFT_CLICK = Cesium.ScreenSpaceEventType.LEFT_CLICK;
const RIGHT_CLICK = Cesium.ScreenSpaceEventType.RIGHT_CLICK;
const MOUSE_MOVE = Cesium.ScreenSpaceEventType.MOUSE_MOVE;
const MOUSE_DOWN = Cesium.ScreenSpaceEventType.LEFT_DOWN;
const MOUSE_UP = Cesium.ScreenSpaceEventType.LEFT_UP;

export class GraphicManager {

    graphicType: GraphicType;
    graphicMap: Map<string, BaseGraphic>;
    mode: 'create' | 'edit';
    currentGraphicId: string;
    cesiumHandler: Cesium.ScreenSpaceEventHandler;

    constructor(private viewer: Cesium.Viewer) {
        this.cesiumHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    }

    createPolyline() {
        this.graphicType = GraphicType.POLYLINE;
        this.currentGraphicId = graphicIdentity.generateId();
        this.addMouseEventListener();
    }

    addMouseEventListener() {

    }

    private createGraphicNode(e: any) {
        this.mode = 'create';
        const cartesian = CVT.pixel2Cartesian(e.position, this.viewer);

        const currentGraphic = this.graphicMap.get(this.currentGraphicId);
        if (currentGraphic && currentGraphic.nodePositions.length === 0) {
            this.cesiumHandler.removeInputAction(MOUSE_MOVE);
            this.cesiumHandler.setInputAction(this.createNodeGuideline, MOUSE_MOVE);
        }
        if (Cesium.defined(cartesian) && this.graphicMap.has(this.currentGraphicId)) {
            this.graphicMap.get(this.currentGraphicId).addNode(cartesian);
        }
    }

    private createNodeGuideline(e) {
        const cartesian = CVT.pixel2Cartesian(e.endPosition, this.viewer);
        if (!Cesium.defined(cartesian)) {
            return;
        }
        // todo
    }

    private accomplishGraphicCreate() {
        const graphic = this.graphicMap.get(this.currentGraphicId);
        if (!graphic) {
            return;
        }
        // todo
    }


}
