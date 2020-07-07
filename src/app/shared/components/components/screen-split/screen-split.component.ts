import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { CesiumViewerOption } from "../../models/models";
import { BaseMapComponent } from "../base-map/base-map.component";
import Layers from "src/assets/ExtendCesium/widgets/Layers";

@Component({
  selector: "app-screen-split",
  templateUrl: "./screen-split.component.html",
  styleUrls: ["./screen-split.component.less"]
})
export class ScreenSplitComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild("leftView", null) leftMap: BaseMapComponent;
  @ViewChild("rightView", null) rightMap: BaseMapComponent;

  @Input() leftViewOptions: CesiumViewerOption;
  @Input() rightViewOptions: CesiumViewerOption;
  @Input() leftImageryViewModels: Array<ViewModelInfo>;
  @Input() rightImageryViewModels: Array<ViewModelInfo>;

  private leftView: any;
  private rightView: any;

  constructor() {}

  public getLeftViewer() {
    return this.leftView;
  }

  public getRightViewer() {
    return this.rightView;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.leftImageryViewModels) {
      const leftModels = this.leftImageryViewModels || [];
      this.updateModels(this.leftView, leftModels);
    }
    if (changes && changes.rightImageryVIewModels) {
      const rightModel = this.rightImageryViewModels || [];
      this.updateModels(this.rightView, rightModel);
    }
  }

  ngAfterViewInit(): void {
    this.leftView = this.leftMap.viewer;
    this.updateModels(this.leftView, this.leftImageryViewModels || []);
    this.rightView = this.rightMap.viewer;
    this.updateModels(this.rightView, this.rightImageryViewModels || []);
    this.leftView.scene.preRender.addEventListener(() => {
      this.syncRightViewer();
    });
    this.rightView.scene.preRender.addEventListener(() => {
      this.syncLeftViewer();
    });
  }

  ngOnInit() {}

  private updateModels(viewer: any, models: Array<ViewModelInfo>) {
    if (!viewer || !viewer.baseLayerPicker) {
      return;
    }
    const layer = new Cesium.zmLayers(viewer);
    const viewModel = viewer.baseLayerPicker.viewModel;
    const imageryModels = models.map(
      item =>
        new Cesium.ProviderViewModel({
          name: item.name,
          iconUrl: item.iconUrl,
          tooltip: item.tooltip,
          creationFunction: () => {
            if (item.type) {
              return layer.getImageryLayer(item.type);
            } else if (item.provider) {
              return item.provider;
            } else {
              throw Error("type 与 provider 必须有一个不为空。");
            }
          }
        })
    );
    if (!imageryModels.length) {
      imageryModels.push(
        new Cesium.ProviderViewModel({
          name: "百度影像",
          iconUrl: Cesium.buildModuleUrl(
            "../../assets/images/imagery/baidu_image.png"
          ),
          tooltip: "百度影像地图服务",
          creationFunction: () => layer.getImageryLayer(Layers.TYPE.Baidu.IMAGE)
        })
      );
    }
    viewModel.imageryProviderViewModels = imageryModels;
    viewModel.selectedImagery = imageryModels[0];
  }
  private syncRightViewer() {
    this.rightView.camera.flyTo({
      destination: this.leftView.camera.position,
      orientation: {
        heading: this.leftView.camera.heading,
        pitch: this.leftView.camera.pitch,
        roll: this.leftView.camera.roll
      },
      duration: 0.0
    });
  }

  private syncLeftViewer() {
    this.leftView.camera.flyTo({
      destination: this.rightView.camera.position,
      orientation: {
        heading: this.rightView.camera.heading,
        pitch: this.rightView.camera.pitch,
        roll: this.rightView.camera.roll
      },
      duration: 0.0
    });
  }
}

export interface ViewModelInfo {
  name: string;
  iconUrl: string;
  tooltip: string;
  type?: Symbol;
  provider?: any;
}
