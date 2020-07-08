import { SkyAtmosphere } from 'cesium';

export interface CesiumViewerOption {
  geocoder?: boolean;
  homeButton?: boolean;
  sceneModePicker?: boolean;
  baseLayerPicker?: boolean;
  navigationHelpButton?: boolean;
  shouldAnimate?: boolean;
  animation?: boolean;
  shadows?: boolean;
  timeline?: boolean;
  fullscreenButton?: boolean;
  infoBox?: boolean;
  selectionIndicator?: boolean;
  skyAtmosphere?: SkyAtmosphere | false;
  imageryProvider?: any;
  terrainProvider?: any;
}
