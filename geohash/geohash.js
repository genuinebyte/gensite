/** Class for calculating a hash point */
class GeoHash {
	constructor(date, dow) {
		this.setDate(date);
		this.setDow(dow);
		this.makeFractions();
	}

	setDate(date) {
		if (!date) {
			this.date = new Date().toISOString().split('T')[0];
		} else {
			this.date = date;
		}

		this.dirty = true;
	}

	setDow(dow) {
		if (!dow) {
			//TODO: Attempt to retreive dow
		} else {
			this.dow = dow;
		}

		this.dirty = true;
	}

	makeFractions() {
		let hash = MD5(this.getHashingString());
		let firstHalf = hash.substr(0,16);
		let secondHalf = hash.substr(16);

		let firstFraction = this.hexToFrac(firstHalf);
		let secondFraction = this.hexToFrac(secondHalf);

		this.dirty = false;
		this.fractions = new Vec2(firstFraction, secondFraction);
	}

	getTarget(lat, lon) {
		if (this.dirty) {
			this.makeFractions();
		}

		return new Vec2(
			Math.absAdd(Math.trunc(lat), this.fractions.x),
			Math.absAdd(Math.trunc(lon), this.fractions.y)
		);
	}

	getHashingString() {
		return this.date + "-" + this.dow;
	}

	getDowUrl() {
		let parts = this.date.split("-");
		return "http://geo.crox.net/djia/" + parts[0] + "/" + parts[1] + "/" + parts[2];
	}

	// Does not deal with https://geohashing.site/geohashing/30W_Time_Zone_Rule
	// TODO: Use geo.crox.net through HTTPS relay at geo.genbyte.dev
	getCurrentDow(load) {
		this.dowLoadCallback = load;
		function internal_load(resp) {
			console.log(resp);
		}

		var req = new XMLHttpRequest();
		req.addEventListener("load", internal_load);
		req.open("GET", url);
		req.send();
	}

	hexToFrac(hex) {
		let ret = 0;
		while (hex.length != 0) {
			ret += parseInt(hex.substr(-1), 16);
			hex = hex.substr(0, hex.length-1);
			ret /= 16;
		}

		return ret;
	}
}

class LocationProvider {
	constructor() {
		this.setHighAccuracy(false);
		this.setTimeout(1000);
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

class GeoUI {
	constructor() {
		window.onload = this.winload.bind(this);
	}

	winload() {
		this.dom = {
			'lat': document.getElementById('lat'),
			'lon': document.getElementById('long'),
			'date': document.getElementById('date'),
			'dow': document.getElementById('dow'),
			'dowlink': document.getElementById('dowlink'),
			'tlat': document.getElementById('tlat'),
			'tlon': document.getElementById('tlong'),
			'nlat': document.getElementById('nlat'),
			'nlon': document.getElementById('nlong'),
			'age': document.getElementById('locage'),
			'crow': document.getElementById('crow'),
			'crowN': document.getElementById('crowN'),
			'crowNE': document.getElementById('crowNE'),
			'crowE': document.getElementById('crowE'),
			'crowSE': document.getElementById('crowSE'),
			'crowS': document.getElementById('crowS'),
			'crowSW': document.getElementById('crowSW'),
			'crowW': document.getElementById('crowW'),
			'crowNW': document.getElementById('crowNW'),
		};

		this.geohash = new GeoHash();
		this.lprov = new LocationProvider();
		this.lprov.setTimeout(250);

		this.dom.date.value = this.geohash.date;
		//TODO: Temporary fix until I get my HTTPS relay setup
		this.dom.dowlink.href = this.geohash.getDowUrl();
	}

	getCurrentLocation() {
		function success(lprov) {
			this.setCurrent(lprov.location);
			this.putCurrent();
			this.displayCurrent();
		}

		function error() {
			alert("Failed to get location");
		}

		this.lprov.setSuccessCallback(success.bind(this));
		this.lprov.setErrorCallback(error.bind(this));
		this.lprov.get();
	}

	watchLocation(highAccuracy) {
		function success(lprov) {
			this.setCurrent(lprov.location);
			this.displayCurrent();
			this.displayCrow();
		}

		function error() {
			alert("Failed to get location");
		}

		function tick(lprov) {
			this.dom.age.innerHTML = lprov.age + "s";
		}

		this.lprov.setSuccessCallback(success.bind(this));
		this.lprov.setErrorCallback(error.bind(this));
		this.lprov.setTickCallback(tick.bind(this));
		this.lprov.setHighAccuracy(highAccuracy);
		this.lprov.watch();
	}

	calculateHash() {
		console.log(this);
		let lat = this.dom.lat.value;
		let lon = this.dom.lon.value;
		let date = this.dom.date.value;
		let dow = this.dom.dow.value;

		if (date && dow) {
			this.geohash.setDate(date);
			this.geohash.setDow(dow);
		} else if (date && !dow) {
			return;
			this.geohash.setDate(date);
			this.geohash.setDow();
		} else {
			return;
			this.geohash.setDate();
			this.geohash.setDow();
		}
		this.setTarget(this.geohash.getTarget(lat, lon));

		this.displayTarget();
		this.displayCrow();
	}

	prettyDistance(target) {
		let dist = this.lprov.distanceKm(target);

		if (dist >= 100) {
			return Math.trunc(dist) + "km";
		} else if (dist >= 10) {
			return Math.truncateDecimals(dist, 1) + "km";
		} else if (dist >= 1) {
			return Math.truncateDecimals(dist, 2) + "km";
		} else {
			// Meters
			return Math.truncateDecimals(dist*1000, 2) + "m"
		}
	}

	setCurrent(vec) {
		this.current = vec.truncateDecimals(5);
	}

	setTarget(vec) {
		this.target = vec.truncateDecimals(5);
	}

	putCurrent() {
		this.dom.lat.value = this.current.x;
		this.dom.lon.value = this.current.y;
	}

	displayTarget() {
		this.dom.tlat.innerHTML = this.target.x;
		this.dom.tlon.innerHTML = this.target.y;
	}

	displayCurrent() {
		this.dom.nlat.innerHTML = this.current.x;
		this.dom.nlon.innerHTML = this.current.y;
	}

	displayCrow() {
		if (this.current || this.target) {
			let distance = this.prettyDistance.bind(this);
			this.dom.crow.innerHTML = distance(this.target);
			this.dom.crowN.innerHTML = distance(this.target.add(1, 0));
			this.dom.crowNE.innerHTML = distance(this.target.add(1, 1));
			this.dom.crowE.innerHTML = distance(this.target.add(0, 1));
			this.dom.crowSE.innerHTML = distance(this.target.add(-1, 1));
			this.dom.crowS.innerHTML = distance(this.target.add(-1, 0));
			this.dom.crowSW.innerHTML = distance(this.target.add(-1, -1));
			this.dom.crowW.innerHTML = distance(this.target.add(0, -1));
			this.dom.crowNW.innerHTML = distance(this.target.add(1, -1));
		}
	}
}

window.geoui = new GeoUI();
