class GeoHash {
	constructor() {
		this.date = new Date().toISOString().split('T')[0];
	}

	calcTarget() {
		let hash = MD5(this.getHashingString());
		let firstHalf = hash.substr(0,16);
		let secondHalf = hash.substr(16);

		this.graticulLatitude = Math.trunc(this.latitude);
		this.graticulLongitude = Math.trunc(this.longitude);

		this.firstFraction = this.hexToFrac(firstHalf);
		this.secondFraction = this.hexToFrac(secondHalf);

		this.targetLatitude = truncateDecimals(
			this.graticulLatitude + (this.graticulLatitude > 0 ? this.firstFraction : this.firstFraction * -1), 5);
		this.targetLongitude = truncateDecimals(
			this.graticulLongitude + (this.graticulLongitude > 0 ? this.secondFraction : this.secondFraction * -1), 5);

		return true;
	}

	currentLocation(success, error) {
		this.successCallback = success;

		function internal_success(position) {
			this.latitude = position.coords.latitude;
			this.longitude = position.coords.longitude;
			this.successCallback();
		}

		if (!navigator.geolocation) {
			return false;
		} else {
			navigator.geolocation.getCurrentPosition(internal_success.bind(this), error);
		}
	}

	getHashingString() {
		return this.date + "-" + this.dow;
	}

	getDowUrl() {
		let parts = this.date.split("-");
		return "http://geo.crox.net/djia/" + parts[0] + "/" + parts[1] + "/" + parts[2];
	}

	// Does not deal with https://geohashing.site/geohashing/30W_Time_Zone_Rule yet
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

class LocationWatcher {
	constructor(success, error, tick, isHighAccuracy) {
		this.successCallback = success;
		this.errorCallback = error;
		this.tickCallback = tick;
		this.isHighAccuracy = isHighAccuracy;
		this.headings = [];
	}

	watch() {
		function success(pos) {
			this.latitude = pos.coords.latitude;
			this.longitude = pos.coords.longitude;
			let heading = pos.coords.heading;

			this.headings.push(heading);
			if (!isNaN(heading) && this.headings.length > 4) {
				this.headings.splice(0, 1);
			}

			this.age = 0;
			this.successCallback(this);
			this.tickCallback(this);
		}

		function error(err) {
			if (err.code == err.TIMEOUT) {
				this.age += 0.25;
				this.tickCallback(this);
			} else {
				this.errorCallback(this);
			}
		}

		this.watcher = navigator.geolocation.watchPosition(
			success.bind(this),
			error.bind(this),
			{"enableHighAccuracy": this.isHighAccuracy, "timeout": 250}
		);
	}

	getHeading() {
		let sum = 0;
		for (let i = 0; i < this.headings.length; ++i) {
			sum += this.headings[i];
		}

		return sum/this.headings.length;
	}

	stop() {
		this.latitude = 0;
		this.longitude = 0;
		this.age = -1;
		navigator.geolocation.clearWatch(this.watcher);
	}

	distanceKm(lat, lon) {
		return this.getDistanceFromLatLonInKm(this.latitude, this.longitude, lat, lon);
	}

	distanceMi(lat, lon) {
		return  truncateDecimals(this.distanceKm(lat, lon) * 0.6213712, 2);
	}

	angle(lat, lon) {
		let dot = (lat*this.latitude) + (lon*this.longitude);
			console.log(dot);
		let mags = Math.sqrt(lat*lat + lon*lon) * Math.sqrt(this.latitude*this.latitude + this.longitude*this.longitude);
			console.log(mags);

		return Math.acos(dot/mags);
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
		return deg * (Math.PI/180)
	}
}

// https://stackoverflow.com/a/9232092/10354782
function truncateDecimals(num, digits) {
	var numS = num.toString(),
		decPos = numS.indexOf('.'),
		substrLength = decPos == -1 ? numS.length : 1 + decPos + digits,
		trimmedResult = numS.substr(0, substrLength),
		finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

	return parseFloat(finalResult);
}

window.onload = function winload() {
	window.geohash = new GeoHash();
	document.getElementById("date").value = geohash.date;

	let dowUrl = geohash.getDowUrl();
	document.getElementById("dowlink").href = dowUrl;

	window.geodom = {
		'lat': document.getElementById('lat'),
		'long': document.getElementById('long'),
		'date': document.getElementById('date'),
		'dow': document.getElementById('dow'),
		'tlat': document.getElementById('tlat'),
		'tlong': document.getElementById('tlong'),
		'nlat': document.getElementById('nlat'),
		'nlong': document.getElementById('nlong')
	};
}

function calcHash() {
	geohash.latitude = geodom.lat.value;
	geohash.longitude = geodom.long.value;
	geohash.date = geodom.date.value;
	geohash.dow = geodom.dow.value;

	if (window.geohash.calcTarget()) {
		document.getElementById('tlat').innerHTML = geohash.targetLatitude;
		document.getElementById('tlong').innerHTML = geohash.targetLongitude;
	} else {
		alert("Failed to calculate target coordinates!");
	}
}

function getLocation() {
	function success() {
		document.getElementById("lat").value = geohash.latitude;
		document.getElementById("long").value = geohash.longitude;
	}

	function error() {
		alert("Unable to get your location.");
	}

	geohash.currentLocation(success, error);
}

function watchPos(isAccurate) {
	function success(lwatcher) {
		document.getElementById("nlat").innerHTML = truncateDecimals(lwatcher.latitude, 5);
		document.getElementById("nlong").innerHTML = truncateDecimals(lwatcher.longitude, 5);

		if (geohash.targetLatitude != 0) {
			document.getElementById("crowflies").innerHTML =
				lwatcher.distanceMi(geohash.targetLatitude, geohash.targetLongitude);

			let x = geohash.targetLatitude - lwatcher.latitude;
			let y = geohash.targetLongitude - lwatcher.longitude;
			let angle = ((Math.atan(x/y) * (180/Math.PI))) + (90 + lwatcher.getHeading());
			document.getElementById("angle").innerHTML = "x: " + x + "y: " + y + " | " + angle + " [" + lwatcher.getHeading() + "]";
			document.getElementById("direction").style.transform = "rotate(" + (angle) + "deg)";
		}
	}

	function error(lwatcher) {
		alert("Failed to get your location");
	}

	function tick(lwatcher) {
		let age = lwatcher.age;
		document.getElementById("locage").innerHTML = age == 0 ? "now" : age + " seconds";
	}

	window.lwatcher = new LocationWatcher(success, error, tick, isAccurate);
	lwatcher.watch();
}
