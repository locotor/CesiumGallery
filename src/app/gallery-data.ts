const urlPrefix = 'demos/';
const imgPrefix = 'assets/images/demos/';

export const demoData = [
    {
        // 常规地图服务
        title: '常规地图服务',
        type: 'item',
        isSelected: true,
        demos: [
            {
                title: '天地图服务',
                url: urlPrefix + 'gene-map-service?type=tiandi',
                img: imgPrefix + 'gene-map-service-tiandi.png'
            },
            // {
            //     title: 'ArcGIS瓦片',
            //     url: urlPrefix + 'gene-map-service?type=arcgis',
            //     img: imgPrefix + 'gene-map-service-arcgis.png'
            // },
            // {
            //     title: '百度地图',
            //     url: urlPrefix + 'gene-map-service?type=baidu',
            //     img: imgPrefix + 'gene-map-service-baidu.png'
            // },
            // {
            //     title: 'MapBox MVT',
            //     url: urlPrefix + 'gene-map-service?type=mapbox',
            //     img: imgPrefix + 'gene-map-service-mapbox.png'
            // },
            // {
            //     title: 'WMS服务',
            //     url: urlPrefix + 'gene-map-service?type=wms',
            //     img: imgPrefix + 'gene-map-service-wms.png'
            // },
            // {
            //   title: "WMTS服务",
            //   url: urlPrefix + "gene-map-service?type=wmts",
            //   img: imgPrefix + "gene-map-service-wmts.png"
            // },
            // {
            //     title: '地形服务',
            //     url: urlPrefix + 'gene-map-service?type=terrain',
            //     img: imgPrefix + 'gene-map-service-terrain.png'
            // }
        ]
    },
    //#region ToDo
    // {
    //     // 三维模型
    //     title: '三维模型',
    //     type: 'item',
    //     isSelected: false,
    //     demos: [
    //         {
    //             title: '城市白模',
    //             url: urlPrefix + 'model3d?type=white-demo',
    //             img: imgPrefix + 'model3d-white-demo.png'
    //         },
    //         {
    //             title: '人工模型',
    //             url: urlPrefix + 'model3d?type=artificial-model',
    //             img: imgPrefix + 'model3d-artificial-model.png'
    //         },
    //         {
    //             title: '3DTile',
    //             url: urlPrefix + 'model3d?type=3d-tile',
    //             img: imgPrefix + 'model3d-3d-tile.png'
    //         },
    //         {
    //             title: 'gltf模型',
    //             url: urlPrefix + 'model3d?type=gltf-model',
    //             img: imgPrefix + 'model3d-gltf-model.png'
    //         },
    //         {
    //             title: 'BIM模型',
    //             url: urlPrefix + 'model3d?type=bim-model',
    //             img: imgPrefix + 'model3d-bim-model.png'
    //         }
    //     ]
    // },
    // {
    //     // 控制及效果
    //     title: '控制及效果',
    //     type: 'item',
    //     isSelected: false,
    //     demos: [
    //         {
    //             title: '底图切换',
    //             url: urlPrefix + 'control-effect?type=switch-layer',
    //             img: imgPrefix + 'control-effect-switch-layer.png'
    //         },
    //         {
    //             title: '信息框',
    //             url: urlPrefix + 'control-effect?type=info-box',
    //             img: imgPrefix + 'control-effect-info-box.png'
    //         },
    //         {
    //             title: '浮动窗',
    //             url: urlPrefix + 'control-effect?type=float-box',
    //             img: imgPrefix + 'control-effect-float-box.png'
    //         },
    //         {
    //             title: '视角书签',
    //             url: urlPrefix + 'perspective?type=view-bookmarks',
    //             img: imgPrefix + 'perspective-view-bookmarks.png'
    //         },
    //         {
    //             title: '视角历史记录',
    //             url: urlPrefix + 'perspective?type=view-history',
    //             img: imgPrefix + 'perspective-view-history.png'
    //         },
    //         {
    //             title: '视角范围限定',
    //             url: urlPrefix + 'perspective?type=view-range',
    //             img: imgPrefix + 'perspective-view-range.png'
    //         },
    //         {
    //             title: '鹰眼地图',
    //             url: urlPrefix + 'eagleDisplay',
    //             img: imgPrefix + 'eagle-display.png'
    //         },
    //         {
    //             title: '图层管理',
    //             url: urlPrefix + 'layer-management',
    //             img: imgPrefix + 'layer-management.png'
    //         },
    //         {
    //             title: '卷帘分析',
    //             url: urlPrefix + 'layerSplit',
    //             img: imgPrefix + 'layer-split.png'
    //         },
    //         {
    //             title: '分屏分析',
    //             url: urlPrefix + 'screenSplit',
    //             img: imgPrefix + 'screen-split.png'
    //         }
    //     ]
    // },
    // {
    //     // 测绘相关
    //     title: '测绘相关',
    //     type: 'sub-menu',
    //     openList: false,
    //     subList: [
    //         {
    //             title: '空间分析',
    //             isSelected: false,
    //             demos: [
    //                 {
    //                     title: '量算',
    //                     url: urlPrefix + 'measurement-map',
    //                     img: imgPrefix + 'measurement-map.png'
    //                 },
    //                 {
    //                     title: '地形开挖',
    //                     url: urlPrefix + 'terrainExcavation',
    //                     img: imgPrefix + 'terrain-excavation.png'
    //                 },
    //                 {
    //                     title: '地下管道',
    //                     url: urlPrefix + 'undergroundPiping',
    //                     img: imgPrefix + 'underground-pipe.png'
    //                 },
    //                 {
    //                     title: '等高线',
    //                     url: urlPrefix + 'contourLine',
    //                     img: imgPrefix + 'contour-line.png'
    //                 },
    //                 {
    //                     title: '可视域分析',
    //                     url: urlPrefix + 'visualAnalysis',
    //                     img: imgPrefix + 'view-shed.png'
    //                 },
    //                 {
    //                     title: '通视分析',
    //                     url: urlPrefix + 'sightlineAnalysis',
    //                     img: imgPrefix + 'sightline.png'
    //                 },
    //                 {
    //                     title: '填方分析',
    //                     url: urlPrefix + 'backFill',
    //                     img: imgPrefix + 'back-fill.png'
    //                 }, {
    //                     title: '淹没分析',
    //                     url: urlPrefix + 'inundation',
    //                     img: imgPrefix + 'inundation.png'
    //                 }
    //             ]
    //         },
    //     ]
    // },
    // {
    //     // 动态效果
    //     title: '动态效果',
    //     type: 'sub-menu',
    //     openList: false,
    //     subList: [
    //         {
    //             title: '动态效果',
    //             isSelected: false,
    //             demos: [
    //                 {
    //                     title: '路径追踪',
    //                     url: urlPrefix + 'walkthrough',
    //                     img: imgPrefix + 'walk-through.gif'
    //                 },
    //                 {
    //                     title: '雷达扫描',
    //                     url: urlPrefix + 'radarScan',
    //                     img: imgPrefix + 'radar-scan.gif'
    //                 },
    //                 {
    //                     title: '水面效果',
    //                     url: urlPrefix + 'waterSurface',
    //                     img: imgPrefix + 'water-surface.png'
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     // 结合三方库
    //     title: '结合三方库',
    //     type: 'sub-menu',
    //     openList: false,
    //     subList: [
    //         {
    //             title: '结合echarts',
    //             isSelected: false,
    //             demos: [
    //                 {
    //                     title: '全国36城“无人区”数',
    //                     url: urlPrefix + 'echarts-map?type=point',
    //                     img: imgPrefix + 'echarts-map-point.png'
    //                 },
    //                 {
    //                     title: '中国境内攻击',
    //                     url: urlPrefix + 'echarts-map?type=attack',
    //                     img: imgPrefix + 'echarts-map-attack.png'
    //                 },
    //                 {
    //                     title: '服务器在线状态',
    //                     url: urlPrefix + 'echarts-map?type=ucd',
    //                     img: imgPrefix + 'echarts-map-ucd.png'
    //                 },
    //                 {
    //                     title: '模拟迁徙',
    //                     url: urlPrefix + 'echarts-map?type=migrate',
    //                     img: imgPrefix + 'echarts-map-migrate.png'
    //                 },
    //                 {
    //                     title: '深圳部分公交线路',
    //                     url: urlPrefix + 'echarts-map?type=bus-routes',
    //                     img: imgPrefix + 'echarts-map-bus-routes.png'
    //                 },
    //                 {
    //                     title: '杭州轨迹',
    //                     url: urlPrefix + 'echarts-map?type=heatmap',
    //                     img: imgPrefix + 'echarts-heatmap.png'
    //                 }
    //             ]
    //         },
    //         {
    //             title: '结合mapv',
    //             isSelected: false,
    //             demos: [
    //                 {
    //                     title: '北京小区范围',
    //                     url: urlPrefix + 'mapv-map?type=village',
    //                     img: imgPrefix + 'mapv-simple.png'
    //                 },
    //                 {
    //                     title: 'mapv-线热力图',
    //                     url: urlPrefix + 'mapv-map?type=line-heatmap',
    //                     img: imgPrefix + 'mapv-line-heatmap.png'
    //                 },
    //                 {
    //                     title: '动态热力图',
    //                     url: urlPrefix + 'mapv-map?type=dy-heatmap',
    //                     img: imgPrefix + 'mapv-dy-heatmap.gif'
    //                 }
    //             ]
    //         },
    //         {
    //             title: '结合heatmap-js',
    //             isSelected: false,
    //             demos: [
    //                 {
    //                     title: '热力图',
    //                     url: urlPrefix + 'heatmap',
    //                     img: imgPrefix + 'heatmap-js.png'
    //                 }
    //             ]
    //         }
    //     ]
    // }
    //#endregion
];
