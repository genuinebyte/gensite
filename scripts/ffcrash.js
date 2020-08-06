function ffcrash() {
	navigator.geolocation.watchPosition(
		function(){
			alert("not-an-error")
		},
		function() {
			alert("error");
		},
		{"timeout": 100}
	);
}