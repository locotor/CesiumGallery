import * as Cesium from 'cesium';

// tslint:disable: indent

const Constants = {
	TWO_PI: 2 * Math.PI,
	HALF_PI: Math.PI / 2,
	FITTING_COUNT: 100,
	ZERO_TOLERANCE: 1e-4
};

export const graphicIdentity = {

	generateId() {
		return (Math.random() * 10000000).toString(16).substr(0, 4) + '-' + (new Date()).getTime() + '-' + Math.random().toString().substr(2, 5);
	}

};

export const CVT = {

	cartesian2Pixel(cartesian, viewer) {
		return Cesium.SceneTransforms.wgs84ToWindowCoordinates(
			viewer.scene,
			cartesian
		);
	},

	pixel2Cartesian(pixel, viewer) {
		if (viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
			return this.pixel2Cartesian1(pixel, viewer);
		} else {
			return this.pixel2Cartesian2(pixel, viewer);
		}
	},

	/**
	 * 二维坐标，没有添加地形数据时调用
	 */
	pixel2Cartesian1(pixel, viewer) {
		const cartesian = viewer.camera.pickEllipsoid(
			pixel,
			viewer.scene.globe.ellipsoid
		);
		return cartesian;
	},

	/**
	 * 三维坐标，添加地形数据时调用
	 */
	pixel2Cartesian2(pixel, viewer) {
		const ray = viewer.camera.getPickRay(pixel);
		const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
		return cartesian;
	},

	cartesian2Radians(cartesian, viewer) {
		const ellipsoid = viewer.scene.globe.ellipsoid || Cesium.Ellipsoid.WGS84;
		const cartographic = Cesium.Cartographic.fromCartesian(
			cartesian,
			ellipsoid
		);
		const lon = cartographic.longitude;
		const lat = cartographic.latitude;
		const height = cartographic.height;
		return { lon, lat, height };
	},

	cartesian2Degrees(cartesian, viewer) {
		const coords = this.cartesian2Radians(cartesian, viewer);
		const lon = Cesium.Math.toDegrees(coords.lon);
		const lat = Cesium.Math.toDegrees(coords.lat);
		const height = coords.height;
		return { lon, lat, height };
	},

	degrees2Cartesian(position) {
		const cartesian = Cesium.Cartesian3.fromDegrees(
			position.lon,
			position.lat,
			position.height
		);
		return cartesian;
	},

	radians2Cartesian(position) {
		return Cesium.Cartesian3.fromRadians(
			position.lon,
			position.lat,
			position.height
		);
	},

	pixel2Degrees(pixel, viewer) {
		const cartesian = this.pixel2Cartesian(pixel, viewer);
		if (Cesium.defined(cartesian)) {
			return this.cartesian2Degrees(cartesian, viewer);
		}
		return undefined;
	},

	pixel2Radians(pixel, viewer) {
		const cartesian = this.pixel2Cartesian(pixel, viewer);
		if (Cesium.defined(cartesian)) {
			return this.cartesian2Radians(cartesian, viewer);
		}
		return undefined;
	},

	toDegrees(position, viewer) {
		if (position instanceof Cesium.Cartesian3) {
			return this.cartesian2Degrees(position, viewer);
		} else if (position instanceof Cesium.Cartesian2) {
			return this.pixel2Degrees(position, viewer);
		}
	},

	toRadians(position, viewer) {
		if (position instanceof Cesium.Cartesian3) {
			return this.cartesian2Radians(position, viewer);
		} else if (position instanceof Cesium.Cartesian2) {
			return this.pixel2Radians(position, viewer);
		}
	},

	toPixel(position, viewer) {
		if (position instanceof Cesium.Cartesian2) {
			return this.cartesian2Pixel(position, viewer);
		}
	}
};

