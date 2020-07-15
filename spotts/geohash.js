class LocationProvider {
	constructor() {
		this.setHighAccuracy(false);
		this.setTimeout(1000);

		this.location = new Vec2(0, 0);
	}

	setSuccessCallback(fn) {
		this.successCallback = fn;
	}

	setErrorCallback(fn) {
		this.errorCallback = fn;
	}

	setTickCallback(fn) {
		this.tickCallback = fn;
	}

	setHighAccuracy(tf) {
		this.isHighAccuracy = tf;
	}

	setTimeout(num) {
		this.timeout = num;
	}

	internalSuccess(pos) {
		this.location = new Vec2(
			pos.coords.latitude,
			pos.coords.longitude
		);
		this.age = 0;
		this.successCallback(this);
		this.tickCallback(this);
	}

	internalError(err) {
		if (err.code == err.TIMEOUT) {
			this.age += this.timeout/1000;
			this.tickCallback(this);
		} else {
			this.errorCallback(this);
		}
	}

	get() {
		if (this.watcher) {
			return false;
		}

		navigator.geolocation.getCurrentPosition(
			this.internalSuccess.bind(this),
			this.internalError.bind(this),
			{"enableHighAccuracy": this.isHighAccuracy, "timeout": this.timeout}
		);
	}

	watch() {
		this.watcher = navigator.geolocation.watchPosition(
			this.internalSuccess.bind(this),
			this.internalError.bind(this),
			{"enableHighAccuracy": this.isHighAccuracy, "timeout": this.timeout}
		);
	}

	stop() {
		this.age = -1;
		navigator.geolocation.clearWatch(this.watcher);
	}

	distanceKm(vec) {
		return this.getDistanceFromLatLonInKm(this.location.x, this.location.y, vec.x, vec.y);
	}

	distanceMi(vec) {
		return this.distanceKm(vec) * 0.6213712;
	}

	// https://stackoverflow.com/a/27943/10354782
	getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
		var R = 6371; // Radius of the earth in km
		var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
		var dLon = this.deg2rad(lon2-lon1);
		var a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
 			Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2);

		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c; // Distance in km
		return d;
	}

	deg2rad(deg) {
		return deg * (Math.PI/180);
	}
}

// https://stackoverflow.com/a/9232092/10354782
Math.truncateDecimals = function(num, digits) {
	var numS = num.toString(),
		decPos = numS.indexOf('.'),
		substrLength = decPos == -1 ? numS.length : 1 + decPos + digits,
		trimmedResult = numS.substr(0, substrLength),
		finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

	return parseFloat(finalResult);
}

Math.absAdd = function(whole, frac) {
	return (Math.abs(whole) + Math.abs(frac)) * Math.sign(whole) * Math.sign(frac);
}

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	truncateDecimals(n) {
		return new Vec2(
			Math.truncateDecimals(this.x, n),
			Math.truncateDecimals(this.y, n)
		);
	}

	add(x, y) {
		return new Vec2(
			this.x+x,
			this.y+y
		);
	}
}