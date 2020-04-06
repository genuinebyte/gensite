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

		this.targetLatitude = this.truncateDecimals(
			this.graticulLatitude + (this.graticulLatitude > 0 ? this.firstFraction : this.firstFraction * -1), 5);
		this.targetLongitude = this.truncateDecimals(
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

	// https://stackoverflow.com/a/9232092/10354782
	truncateDecimals(num, digits) {
		var numS = num.toString(),
			decPos = numS.indexOf('.'),
			substrLength = decPos == -1 ? numS.length : 1 + decPos + digits,
			trimmedResult = numS.substr(0, substrLength),
			finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

		return parseFloat(finalResult);
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
		console.log("Ajh");
	} else {
		alert("Failed to calculate target coordinates!");
	}
}

function getLocation() {
	function success() {
		document.getElementById("lat").value = geohash.latitude;
		document.getElementById("long").value = geohash.longitude;
		alert("Location retreived");
	}

	function error() {
		alert("Unable to get your location.");
	}

	geohash.currentLocation(success, error);
}

function watchPos(isAccurate) {
	function success(pos) {
		document.getElementById("nlat").innerHTML = geohash.truncateDecimals(pos.coords.latitude, 5);
		document.getElementById("nlong").innerHTML = geohash.truncateDecimals(pos.coords.longitude, 5);
	}

	function error(error) {
		if (error.code == error.TIMEOUT) {
			return;
		}

		alert("Failed to get your location");
	}

	navigator.geolocation.watchPosition(success, error, {
		'enableHighAccuracy': isAccurate,
		'timeout': 1000
	});
}
