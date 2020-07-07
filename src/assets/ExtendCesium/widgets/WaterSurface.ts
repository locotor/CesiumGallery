import * as shapefile from "shapefile";
import { Feature } from "@turf/turf";

const glsl = (x: TemplateStringsArray) => x.toString();

export class WaterSurface {
  private viewer: any;
  private extrudedHeight: number;
  private waterPrimitives: Array<any>;
  private normalMapUrl: string;

  constructor(options: WaterSurfaceOptions) {
    this.viewer = options.viewer;
    this.normalMapUrl = options.normalMapUrl;
    this.extrudedHeight = options.extrudedHeight || 0;
    this.waterPrimitives = [];
  }

  clear() {
    if (this.waterPrimitives && this.waterPrimitives.length) {
      this.waterPrimitives.forEach(primitive => {
        this.viewer.scene.primitives.remove(primitive);
      });
      this.waterPrimitives = [];
    }
  }

  setGeojsonData(
    geojson:
      | GeoJSON.FeatureCollection
      | Feature<GeoJSON.Polygon, { [name: string]: any }>
      | Feature<GeoJSON.MultiPolygon, { [name: string]: any }>
      | GeoJSON.Polygon
      | GeoJSON.MultiPolygon
  ) {
    this.clear();
    const fs = this.waterSurfaceFS();
    const appearance = this.createAppearence(fs, this.normalMapUrl);
    this.geojson2PolygonGeometry(geojson, this.extrudedHeight).then(
      geometries => {
        geometries.forEach(geo => {
          const primitive = new Cesium.Primitive({
            allowPicking: false,
            geometryInstances: new Cesium.GeometryInstance({
              geometry: geo
            }),
            appearance: appearance,
            asynchronous: false
          });
          this.viewer.scene.primitives.add(primitive);
          this.waterPrimitives.push(primitive);
        });
      }
    );
  }

  setShapefileData(shp: string, dbf: string) {
    shapefile
      .open(shp, dbf)
      .then((source: any) =>
        source.read().then((data: any) => {
          console.log(data);
          this.setGeojsonData(data.value);
        })
      )
      .catch((error: any) => console.error(error.stack));
  }

  private geojson2PolygonGeometry(
    geojson:
      | GeoJSON.FeatureCollection
      | Feature<GeoJSON.Polygon, { [name: string]: any }>
      | Feature<GeoJSON.MultiPolygon, { [name: string]: any }>
      | GeoJSON.Polygon
      | GeoJSON.MultiPolygon,
    extrudedHeight: number
  ): Promise<Array<any>> {
    this.expandThickness(geojson);
    return new Promise((resolve, reject) => {
      Cesium.GeoJsonDataSource.load(geojson, {}).then(entityCollection => {
        const polygonHierarchys = entityCollection.entities.values.map(
          entity => {
            if (!entity.polygon) {
              reject("geojson 传入类型必须是 Polygon 或者MultiPolygon");
            }
            return entity.polygon.hierarchy.getValue(
              new Cesium.JulianDate(),
              new Cesium.PolygonHierarchy()
            );
          }
        );
        resolve(
          polygonHierarchys.map(
            ph =>
              new Cesium.PolygonGeometry({
                polygonHierarchy: ph,
                extrudedHeight,
                perPositionHeight: true
              })
          )
        );
      });
    });
  }

  private expandThickness(
    geojson:
      | GeoJSON.FeatureCollection
      | Feature<GeoJSON.Polygon, { [name: string]: any }>
      | Feature<GeoJSON.MultiPolygon, { [name: string]: any }>
      | GeoJSON.Polygon
      | GeoJSON.MultiPolygon
  ) {
    if (geojson.type === "FeatureCollection") {
      geojson.features.forEach(
        (
          feature:
            | Feature<GeoJSON.Polygon, { [name: string]: any }>
            | Feature<GeoJSON.MultiPolygon, { [name: string]: any }>
        ) => {
          if (feature.geometry.type === "Polygon") {
            this.expandPolygonThickness(feature.geometry);
          } else if (feature.geometry.type === "MultiPolygon") {
            this.expandMultiPolygonThickness(feature.geometry);
          }
        }
      );
    } else if (geojson.type === "Feature") {
      if (geojson.geometry.type === "MultiPolygon") {
        this.expandMultiPolygonThickness(geojson.geometry);
      } else if (geojson.geometry.type === "Polygon") {
        this.expandPolygonThickness(geojson.geometry);
      }
    } else if (geojson.type === "MultiPolygon") {
      this.expandMultiPolygonThickness(geojson);
    } else if (geojson.type === "Polygon") {
      this.expandPolygonThickness(geojson);
    }
  }

  private expandPolygonThickness(poly: GeoJSON.Polygon) {
    poly.coordinates.forEach(item1 => {
      item1.forEach(item2 => {
        if (item2.length < 3) {
          item2.push(5);
        }
      });
    });
  }

  private expandMultiPolygonThickness(multiPoly: GeoJSON.MultiPolygon) {
    multiPoly.coordinates.forEach(item1 => {
      item1.forEach(item2 => {
        item2.forEach(item3 => {
          if (item3.length < 3) {
            item3.push(5);
          }
        });
      });
    });
  }

  private waterSurfaceFS() {
    return glsl`
    varying vec3 v_positionMC;
    varying vec3 v_positionEC;
    varying vec2 v_st;

    void main()
    {
      czm_materialInput materialInput;
      vec3 normalEC=normalize(czm_normal3D*czm_geodeticSurfaceNormal(v_positionMC,vec3(0.),vec3(1.)));
      #ifdef FACE_FORWARD
      normalEC=faceforward(normalEC,vec3(0.,0.,1.),-normalEC);
      #endif
      materialInput.s=v_st.s;
      materialInput.st=v_st;
      materialInput.str=vec3(v_st,0.);
      materialInput.normalEC=normalEC;
      materialInput.tangentToEyeMatrix=czm_eastNorthUpToEyeCoordinates(v_positionMC,materialInput.normalEC);
      vec3 positionToEyeEC=-v_positionEC;
      materialInput.positionToEyeEC=positionToEyeEC;
      czm_material material=czm_getMaterial(materialInput);
      #ifdef FLAT
      gl_FragColor=vec4(material.diffuse+material.emission,material.alpha);
      #else
      gl_FragColor=czm_phong(normalize(positionToEyeEC),material,czm_lightDirectionEC);
      gl_FragColor.a=.5;
      #endif
    }`;
  }

  private createAppearence(fs: string, url: string) {
    return new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          type: "Water",
          uniforms: {
            normalMap: url,
            frequency: 1000.0,
            animationSpeed: 0.05,
            amplitude: 10.0
          }
        }
      }),
      fragmentShaderSource: fs
    });
  }
}

export interface WaterSurfaceOptions {
  viewer: any;
  normalMapUrl: string;
  extrudedHeight?: number;
}
