(function(){
	var isNative = false;
	var isAndroid = (/android/gi).test(navigator.appVersion);
	var isIOSDevice = (/iphone|ipad/gi).test(navigator.appVersion);
	if(isIOSDevice || isAndroid){
		isNative = !(/Version/gi).test(navigator.appVersion);
	}

	
	window.navigator.isAndroid = isAndroid;
	window.navigator.isIOSDevice = isIOSDevice;
	window.navigator.isNative = isNative;
})();