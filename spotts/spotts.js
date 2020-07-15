class Spotts {
	constructor() {
		this.provider = new LocationProvider();
		if (!this.provider) {
			//TODO: Fail better
			alert("Failed to find LocationProvider!");
			return;
		}
		this.provider.setSuccessCallback(this.locationCallback.bind(this));
		this.provider.setErrorCallback(this.errorCallback.bind(this));
		this.provider.setTickCallback(function(){});

		this.ui = {
			name: document.getElementById("name"),
			coords: document.getElementById("coords"),
			clear: document.getElementById("clear")
		};
		this.clearDefText = this.ui.clear.value;
		this.clearDef = 4; 
		this.clearCur = 4;

		this.loadLocations();
	}

	saveAction() {
		console.log("Saving spot..");
		this.provider.get();
	}

	clearAction() {
		if (this.clearCur === 0) {
			localStorage.removeItem("spotts");
			this.loadLocations();
			this.clearCur = this.clearDef;
			this.ui.clear.value = this.clearDefText;
			alert("Spotts cleared!");
			return;
		}
		this.clearCur--;
		this.ui.clear.value = "Click " + (this.clearCur+1) + " more times";
	}

	locationCallback(provider) {
		let name = this.ui.name.value;
		if (name === "") {
			alert("The position must have a name");
			return;
		}

		let lat = provider.location.x;
		let lon = provider.location.y;

		let spott = {
			name: name,
			latitude: lat ? lat : 0,
			longitude: lon ? lon : 0,
			timestamp: Date.now()
		};

		let spotts = localStorage.getItem("spotts");
		if (spotts == undefined) {
			spotts = [];
		} else {
			spotts = JSON.parse(spotts);
		}
		console.log(spotts);
		spotts.push(spott);
		localStorage.setItem("spotts", JSON.stringify(spotts));
		this.ui.name.value = "";
		this.displaySpot(spott);
	}

	errorCallback(provider) {
		//alert("Error failed to save point!");
		this.locationCallback(this.provider);
	}

	loadLocations() {
		this.ui.coords.innerHTML = "";

		let spottsRaw = localStorage.getItem("spotts");
		if (spottsRaw) {
			let spotts = JSON.parse(spottsRaw);
			for (let i = 0; i < spotts.length; ++i) {
				this.displaySpot(spotts[i]);
			}
		}
	}

	displaySpot(spot) {
		let coord = document.createElement('div');
		coord.textContent = spot.name + ": " + spot.latitude + ", " + spot.longitude;
		this.ui.coords.appendChild(coord);
	}
}

window.spotts = new Spotts();