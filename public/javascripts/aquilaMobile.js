/*!
 * Aquila v1.0
 * Copyright 2011-2014 Suitefolio, LLC.
 * Licensed under development
*/
"use strict";
(function(context) {

	var DEFAULT_OPTIONS = {
		height: 0,
		width: 0,
		videoURL: undefined,
		target: undefined,
		fov: 90.0,
		minFOV: 60,
		maxFOV: 120,
		callback: function() {
			if(typeof console !== 'undefined') {
				console.log('aquila initialized');
			}
		}
	};

	var options;

	var SPHERE_QUALITY = 60;

	var SPHERE_RADIUS = 1024;

	var NEAR = 10,
		FAR = 10000;

	var H_ROT_AX = new THREE.Vector3(0, 1, 0);

	var V_ROT_AX = new THREE.Vector3(0, 0, 1);

	var INITIALIZED = false;

	var renderer = null;

	var video = null;

	var movieSphere = null;

	var videoTexture = null;

	var scene;

	var camera;

	var effect;

	var controls;

	var useRift = false;

	var extend = function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var o = arguments[i];
			for (var k in o) {
				if(o.hasOwnProperty(k)) {
					target[k] = o[k];
				}
			}
		}
		return target;
	};

	var rotateAroundWorldAxis = function(object, axis, radians) {
		var rotWorldMatrix = new THREE.Matrix4();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
		rotWorldMatrix.multiply(object.matrix);

		object.matrix = rotWorldMatrix;
		object.rotation.setFromRotationMatrix(object.matrix);
	};

	var setFOV = function(fov) {
		var hfov = fov;
		var ASPECT = options.width / options.height;
		var vfov = (2.0 * Math.atan(Math.tan(hfov * Math.PI / 180.0 / 2.0) / ASPECT)) * 180.0 / Math.PI;

		if (camera.fov !== vfov) {
			camera.fov = vfov;
			camera.updateProjectionMatrix();
			return true;
		}
	};

	var initCam = function() {
		var ASPECT = options.width / options.height;
		camera = new THREE.PerspectiveCamera(35, ASPECT, NEAR, FAR);
		camera.position.set(0, 0, 0);

		var deg = 0;
		deg *= Math.PI / 180;
		var lat = new THREE.Vector3(Math.cos(deg), 0, Math.sin(deg));
		camera.lookAt(lat);

		setFOV(options.fov);

		controls = new THREE.DeviceOrientationControls( camera );
	};

	var render = function() {
		requestAnimationFrame(render);
		if(video.readyState === video.HAVE_ENOUGH_DATA) {
			videoTexture.needsUpdate = true;
		}
		if(useRift){
 			effect.render(scene, camera);
 		}else{
 			renderer.render(scene, camera);
 		}
		controls.update();
		//stats.update();
	};

	var initRenderer = function() {
		if(Detector.webgl) {
			renderer = new THREE.WebGLRenderer({
				antialias: false
			});
			effect = new THREE.OculusRiftEffect(renderer, {worldScale:100});
			effect.setSize(options.width, options.height);
		} else {
			renderer = new THREE.CanvasRenderer();
			if(typeof console !== 'undefined') {
				console.log('No WebGL support');
			}
		}
		renderer.setSize(context.innerWidth, context.innerHeight);

		//effect = new THREE.OculusRiftEffect(renderer, {worldScale:100});
		//effect.setSize(options.width, options.height);

		options.target.appendChild(renderer.domElement);
	};

	// var initStats = function() {
	// 	stats = new Stats();
	// 	// stats.domElement.style.position = 'absolute';
	// 	// stats.domElement.style.bottom = '0px';
	// 	// stats.domElement.style.zIndex = 100;
	// 	options.target.appendChild(stats.domElement);
	// };

	var initVideo = function(loadedCallback) {
		video = document.createElement('video');
		video.volume = 0;
		video.loop = true;
		video.src = options.videoURL;
		video.oncanplay = loadedCallback;
		video.load();
	};

	var initTexture = function() {
		videoTexture = new THREE.Texture(video);
		videoTexture.repeat.set(-1, 1);
		videoTexture.offset.set(1, 0);
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
	};

	var initSphere = function() {
		initTexture();

		var movieMaterial = new THREE.MeshBasicMaterial({
			map: videoTexture,
			overdraw: true,
			blending: THREE.NoBlending,
			shading: THREE.NoShading,
			fog: false,
			side: THREE.BackSide
		});

		var movieGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, SPHERE_QUALITY, SPHERE_QUALITY);
		movieGeometry.dynamic = true;
		movieSphere = new THREE.Mesh(movieGeometry, movieMaterial);
		movieSphere.position.set(0, 0, 0);
	};

	var initScene = function() {
		scene = new THREE.Scene();

		initSphere();
		scene.add(movieSphere);

		initCam();
		scene.add(camera);
	};

	var afterVideoLoad = function() {
		if(!INITIALIZED){
			video.oncanplay = undefined;
			video.currentTime = 0;
			video.play();
			video.volume = 0;
		}
		initRenderer();

		//initStats();

		initScene();

		INITIALIZED = true;
		render();
		controls.connect();
		options.callback();
	};


	var init = function(opts) {
		options = extend({},
			DEFAULT_OPTIONS, {
				width: window.innerWidth,
				height: window.innerHeight
			},
			opts
		);

		initVideo(afterVideoLoad);
		if(INITIALIZED){
			afterVideoLoad();
		}
	};

	context.aquila = {
		init: init,
		pan: function(delta) {
			if(!INITIALIZED) {
				return;
			}
			var dy = delta.y;
			var dx = delta.x;

			rotateAroundWorldAxis(movieSphere, V_ROT_AX, dy);
			movieSphere.rotateOnAxis(H_ROT_AX, dx);
		},

		zoom: function(zoom) {
			if(!INITIALIZED) {
				return;
			}
			options._hfov = options.fov / zoom;
			options._hfov = Math.max(options.minFOV, Math.min(options.maxFOV, options._hfov));
			return setFOV(options._hfov);
		},

		getZoom: function() {
			return options.fov / (options._hfov || options.fov);
		},

		getVideo: function() {
			return video;
		},
		resize: function(size) {
			options.width = size.width;
			options.width = size.width;
			if(useRift){
				effect.setSize(options.width, options.height);
			}
			else{
				renderer.setSize(context.innerWidth, context.innerHeight);
			}
			initCam();
			controls.connect();
		},
		toggleRender: function(){
			useRift = !useRift;
			// afterVideoLoad();
		}
	};
})(window);