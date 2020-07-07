import Drawer from './widgets/Drawer';
import Echarts from './widgets/Echarts';
import Layers from './widgets/Layers';
import BaiduImageryProvider from './widgets/Imagery/provider/BaiduImageryProvider';
import { ZmHeatmap } from './widgets/Heatmap';
import InfoDisplay from './widgets/InfoDisplay';
import { Walkthrough } from './widgets/Walkthrough';
import VisualAngle from './widgets/VisualAngle';
import { Sightline } from './widgets/Sightline';
import {EagleDisplay} from './widgets/EagleDisplay';
import { LayerSplit } from './widgets/LayerSplit';
import { WaterSurface } from "./widgets/WaterSurface";
import { BackFill } from './widgets/BackFill';
import { Inundation } from './widgets/Inundation';


export default class ExtendCesium {
  static init(Cesium) {
    Cesium.zmDrawer = Drawer; // 绘画相关拓展
    Cesium.zmEcharts = Echarts; // 结合 echarts
    Cesium.zmLayers = Layers; // 底图预设
    Cesium.zmInfoDisplay = InfoDisplay; // 信息框、浮动窗等
    Cesium.zmVisualAngle = VisualAngle; // 视角
    Cesium.zmBaiduImageryProvider = BaiduImageryProvider; // 底图预设
    Cesium.zmHeatmap = ZmHeatmap;
    Cesium.zmWalkthrough = Walkthrough;
    Cesium.zmSightline = Sightline;
    Cesium.zmEagleDisplay = EagleDisplay;
    Cesium.zmLayerSplit = LayerSplit;
    Cesium.zmWaterSurface= WaterSurface; // 水面效果
    Cesium.zmBackFill = BackFill; // 填方分析
    Cesium.zmInundation = Inundation; // 淹没分析
  }
}
