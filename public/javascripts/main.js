"use strict";
(function(context){
	var PAN_VELOCITY = 0.005;

	// Hold previous touch center. Important for calculating the delta movement values
	var prevCenter;

	// Hammer and normal events listeners
	var listeners = {
		hammer: {
			tap: function() {
				aquila.zoom(0);
			},
			dragstart: function(e) {
				prevCenter = e.gesture.center;
			},
			drag: function(e) {
				var dx = e.gesture.center.pageX - prevCenter.pageX;
				var dy = e.gesture.center.pageY - prevCenter.pageY;
				prevCenter = e.gesture.center;

				aquila.pan({
					x: -dx * PAN_VELOCITY,
					y: -dy * PAN_VELOCITY
				});
			}
		},
		mousewheel: function(e) {
			var chg = 1 + (e.originalEvent.deltaY < 0 ? 0.1 : -0.1);
			var newZoom = aquila.getZoom() * chg;
			aquila.zoom(newZoom);
		}
	};

	// Assign initial listeners
	var initControls = function() {
		$.each(listeners.hammer, function(k, v) {
			$('#aquila').hammer({
				'prevent_default': true
			}).on(k, v);
		});

		$('#aquila').on('mousewheel', listeners.mousewheel);
		$('.fullscreen.btn').on('click', function(){
			if(THREEx.FullScreen.activated()) {
				THREEx.FullScreen.cancel();
				$('#down').hide();
				$('#up').show();
				console.log("up");
			} else {
				THREEx.FullScreen.request();
				$('#up').hide();
				$('#down').show();
				console.log("down");
			}
		});

	};

	context.init = function(opts) {
		$('.fullscreen.btn .down').hide();
		$(window).on('resize', function(){
			var size = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			//console.log(size);
			$(opts.$target).css(size).attr(size);
			aquila.resize(size);
		});
		aquila.init({
			fov:96,
			width: opts.$target.width(),
			height: opts.$target.height(),
			videoURL: opts.videoURL,
			target: opts.$target[0],
			callback: function() {
				initControls();
			}
		});


		$('#toggle-render').on('click', function(){
			aquila.toggleRender();
						var size = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			aquila.resize(size);
		});
	};
})(window);