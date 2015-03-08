THREE.HeadOrientationControls = function ( object ) {

	var scope = this;

	var bridge;

	this.object = object;

	this.object.rotation.reorder( "YXZ" );

	this.freeze = true;

	this.headOrientation = {};


	var onHeadOrientationChangeEvent = function ( quatValues ) {

		scope.headOrientation = quatValues;

	};


	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function ( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, alpha, gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler );                               // orient the device

			quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation

		}

	}();

	this.connect = function() {

		bridge = new OculusBridge({
			"onOrientationUpdate" : onHeadOrientationChangeEvent
		});

		bridge.connect();

		scope.freeze = false;

	};

	this.disconnect = function() {

		scope.freeze = true;

		bridge.disconnect();
	};

	this.update = function () {

		if ( scope.freeze ) return;

		var alpha  = scope.headOrientation.z  ?  scope.headOrientation.alpha  : 0; // Z
		var beta   = scope.headOrientation.x  ?  scope.headOrientation.beta   : 0; // X'
		var gamma  = scope.headOrientation.y  ?  scope.headOrientation.gamma  : 0; // Y''
		var orient = 0; // O

		setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

	};

};