const Constants = {
	TWO_PI: 2 * Math.PI,
	HALF_PI: Math.PI / 2,
	FITTING_COUNT: 100,
	ZERO_TOLERANCE: 1e-4
}

export const PlotUtils = {
	distance(t, o) {
		return Math.sqrt(Math.pow(t[0] - o[0], 2) + Math.pow(t[1] - o[1], 2))
	},

	wholeDistance(t) {
		for (var o = 0, e = 0; e < t.length - 1; e++) o += PlotUtils.distance(t[e], t[e + 1]);
		return o
	},

	getBaseLength(t) {
		return Math.pow(PlotUtils.wholeDistance(t), .99)
	},

	mid(t, o) {
		return [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2]
	},

	getCircleCenterOfThreePoints(t, o, e) {
		var r = [(t[0] + o[0]) / 2, (t[1] + o[1]) / 2],
			n = [r[0] - t[1] + o[1], r[1] + t[0] - o[0]],
			g = [(t[0] + e[0]) / 2, (t[1] + e[1]) / 2],
			i = [g[0] - t[1] + e[1], g[1] + t[0] - e[0]];
		return PlotUtils.getIntersectPoint(r, n, g, i)
	},

	getIntersectPoint(t, o, e, r) {
		if (t[1] == o[1]) {
			var n = (r[0] - e[0]) / (r[1] - e[1]),
				g = n * (t[1] - e[1]) + e[0],
				i = t[1];
			return [g, i]
		}
		if (e[1] == r[1]) {
			var s = (o[0] - t[0]) / (o[1] - t[1]);
			return g = s * (e[1] - t[1]) + t[0], i = e[1], [g, i]
		}
		return s = (o[0] - t[0]) / (o[1] - t[1]), n = (r[0] - e[0]) / (r[1] - e[1]), i = (s * t[1] - t[0] - n * e[1] + e[0]) / (s - n), g = s * i - s * t[1] + t[0], [g, i]
	},

	getAzimuth(t, o) {
		var e, r = Math.asin(Math.abs(o[1] - t[1]) / PlotUtils.distance(t, o));
		return o[1] >= t[1] && o[0] >= t[0] ? e = r + Math.PI : o[1] >= t[1] && o[0] < t[0] ? e = Constants.TWO_PI - r : o[1] < t[1] && o[0] < t[0] ? e = r : o[1] < t[1] && o[0] >= t[0] && (e = Math.PI - r), e
	},

	getAngleOfThreePoints(t, o, e) {
		var r = PlotUtils.getAzimuth(o, t) - PlotUtils.getAzimuth(o, e);
		return 0 > r ? r + Constants.TWO_PI : r
	},

	isClockWise(t, o, e) {
		return (e[1] - t[1]) * (o[0] - t[0]) > (o[1] - t[1]) * (e[0] - t[0])
	},

	getPointOnLine(t, o, e) {
		var r = o[0] + t * (e[0] - o[0]),
			n = o[1] + t * (e[1] - o[1]);
		return [r, n]
	},

	getCubicValue(t, o, e, r, n) {
		t = Math.max(Math.min(t, 1), 0);
		var g = 1 - t,
			i = t * t,
			s = i * t,
			a = g * g,
			l = a * g,
			u = l * o[0] + 3 * a * t * e[0] + 3 * g * i * r[0] + s * n[0],
			c = l * o[1] + 3 * a * t * e[1] + 3 * g * i * r[1] + s * n[1];
		return [u, c]
	},

	getThirdPoint(t, o, e, r, n) {
		var g = PlotUtils.getAzimuth(t, o),
			i = n ? g + e : g - e,
			s = r * Math.cos(i),
			a = r * Math.sin(i);
		return [o[0] + s, o[1] + a]
	},

	getArcPoints(t, o, e, r) {
		var n, g, i = [],
			s = r - e;
		s = 0 > s ? s + Constants.TWO_PI : s;
		for (var a = 0; a <= Constants.FITTING_COUNT; a++) {
			var l = e + s * a / Constants.FITTING_COUNT;
			n = t[0] + o * Math.cos(l), g = t[1] + o * Math.sin(l), i.push([n, g])
		}
		return i
	},

	getBisectorNormals(t, o, e, r) {
		var n = PlotUtils.getNormal(o, e, r),
			g = Math.sqrt(n[0] * n[0] + n[1] * n[1]),
			i = n[0] / g,
			s = n[1] / g,
			a = PlotUtils.distance(o, e),
			l = PlotUtils.distance(e, r);
		if (g > Constants.ZERO_TOLERANCE) if (PlotUtils.isClockWise(o, e, r)) {
			var u = t * a,
				c = e[0] - u * s,
				p = e[1] + u * i,
				h = [c, p];
			u = t * l, c = e[0] + u * s, p = e[1] - u * i;
			var d = [c, p]
		} else u = t * a, c = e[0] + u * s, p = e[1] - u * i, h = [c, p], u = t * l, c = e[0] - u * s, p = e[1] + u * i, d = [c, p];
		else c = e[0] + t * (o[0] - e[0]), p = e[1] + t * (o[1] - e[1]), h = [c, p], c = e[0] + t * (r[0] - e[0]), p = e[1] + t * (r[1] - e[1]), d = [c, p];
		return [h, d]
	},

	getNormal(t, o, e) {
		var r = t[0] - o[0],
			n = t[1] - o[1],
			g = Math.sqrt(r * r + n * n);
		r /= g, n /= g;
		var i = e[0] - o[0],
			s = e[1] - o[1],
			a = Math.sqrt(i * i + s * s);
		i /= a, s /= a;
		var l = r + i,
			u = n + s;
		return [l, u]
	},

	getCurvePoints(t, o) {
		for (var e = PlotUtils.getLeftMostControlPoint(o), r = [e], n = 0; n < o.length - 2; n++) {
			var g = o[n],
				i = o[n + 1],
				s = o[n + 2],
				a = PlotUtils.getBisectorNormals(t, g, i, s);
			r = r.concat(a)
		}
		var l = PlotUtils.getRightMostControlPoint(o);
		r.push(l);
		var u = [];
		for (n = 0; n < o.length - 1; n++) {
			g = o[n], i = o[n + 1], u.push(g);
			for (var t = 0; t < Constants.FITTING_COUNT; t++) {
				var c = PlotUtils.getCubicValue(t / Constants.FITTING_COUNT, g, r[2 * n], r[2 * n + 1], i);
				u.push(c)
			}
			u.push(i)
		}
		return u
	},

	getLeftMostControlPoint(o) {
		var e = o[0],
			r = o[1],
			n = o[2],
			g = PlotUtils.getBisectorNormals(0, e, r, n),
			i = g[0],
			s = PlotUtils.getNormal(e, r, n),
			a = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
		if (a > Constants.ZERO_TOLERANCE) var l = PlotUtils.mid(e, r),
			u = e[0] - l[0],
			c = e[1] - l[1],
			p = PlotUtils.distance(e, r),
			h = 2 / p,
			d = -h * c,
			f = h * u,
			E = d * d - f * f,
			v = 2 * d * f,
			A = f * f - d * d,
			_ = i[0] - l[0],
			y = i[1] - l[1],
			m = l[0] + E * _ + v * y,
			O = l[1] + v * _ + A * y;
		else m = e[0] + t * (r[0] - e[0]), O = e[1] + t * (r[1] - e[1]);
		return [m, O]
	},

	getRightMostControlPoint(o) {
		var e = o.length,
			r = o[e - 3],
			n = o[e - 2],
			g = o[e - 1],
			i = PlotUtils.getBisectorNormals(0, r, n, g),
			s = i[1],
			a = PlotUtils.getNormal(r, n, g),
			l = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
		if (l > Constants.ZERO_TOLERANCE) var u = PlotUtils.mid(n, g),
			c = g[0] - u[0],
			p = g[1] - u[1],
			h = PlotUtils.distance(n, g),
			d = 2 / h,
			f = -d * p,
			E = d * c,
			v = f * f - E * E,
			A = 2 * f * E,
			_ = E * E - f * f,
			y = s[0] - u[0],
			m = s[1] - u[1],
			O = u[0] + v * y + A * m,
			T = u[1] + A * y + _ * m;
		else O = g[0] + t * (n[0] - g[0]), T = g[1] + t * (n[1] - g[1]);
		return [O, T]
	},

	getBezierPoints(t) {
		if (t.length <= 2) return t;
		for (var o = [], e = t.length - 1, r = 0; 1 >= r; r += .01) {
			for (var n = y = 0, g = 0; e >= g; g++) {
				var i = PlotUtils.getBinomialFactor(e, g),
					s = Math.pow(r, g),
					a = Math.pow(1 - r, e - g);
				n += i * s * a * t[g][0], y += i * s * a * t[g][1]
			}
			o.push([n, y])
		}
		return o.push(t[e]), o
	},

	getFactorial(t) {
		if (1 >= t) return 1;
		if (2 == t) return 2;
		if (3 == t) return 6;
		if (4 == t) return 24;
		if (5 == t) return 120;
		for (var o = 1, e = 1; t >= e; e++) o *= e;
		return o
	},

	getQBSplinePoints(t) {
		if (t.length <= 2) return t;
		var o = 2,
			e = [],
			r = t.length - o - 1;
		e.push(t[0]);
		for (var n = 0; r >= n; n++) for (var g = 0; 1 >= g; g += .05) {
			for (var i = y = 0, s = 0; o >= s; s++) {
				var a = PlotUtils.getQuadricBSplineFactor(s, g);
				i += a * t[n + s][0], y += a * t[n + s][1]
			}
			e.push([i, y])
		}
		return e.push(t[t.length - 1]), e
	},

	getQuadricBSplineFactor(t, o) {
		return 0 == t ? Math.pow(o - 1, 2) / 2 : 1 == t ? (-2 * Math.pow(o, 2) + 2 * o + 1) / 2 : 2 == t ? Math.pow(o, 2) / 2 : 0
	},

}
