/**
 * JavaScript for the "Places" admin view.
 **/

document.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;

google.maps.Polygon.prototype.getBounds = function() {
	var bounds = new google.maps.LatLngBounds();
	var paths = this.getPaths();
	var path;        
	for (var i = 0; i < paths.getLength(); i++) {
		path = paths.getAt(i);
		for (var ii = 0; ii < path.getLength(); ii++) {
			bounds.extend(path.getAt(ii));
		}
	}
	return bounds;
}


var rpGMF = {
	firstLoad: (place)?true:false,
	place_polygon: null,
	place_polygon_path: null,
	place_point: null,
	map: null,
	mapdom: $("#location"),
	pathToArray: function(poly){
		var plarr=[];
		var points = poly.getPath().getArray();
		for(k in points){
			plarr.push([points[k].lng(),points[k].lat()]);
		}
		plarr.push([points[0].lng(),points[0].lat()]);
		return [plarr];
	},
	polyChanged: function(){
		rpGMF.updateField(rpGMF.pathToArray(rpGMF.place_polygon));
	},
	delPoly: function(poly){
		if(poly){
			poly.setMap(null);
			vertices = poly.getPath();
			for (var i = vertices.length-1; i > -1; i--) {
				vertices.removeAt(i);
			}
		}
	},
	drawPolygon: function(polArr){

		polArr[0].pop(); // remove last repeeted element.

		var place_coords=[];
		
		for(k in polArr[0]){
			place_coords.push(new google.maps.LatLng(polArr[0][k][1], polArr[0][k][0]));
		}

		rpGMF.place_polygon = new google.maps.Polygon({
			paths: place_coords,
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			draggable: true,
			geodesic: true,
			editable: true
		});

		rpGMF.place_polygon.setMap(rpGMF.map);

		if(rpGMF.firstLoad){
			rpGMF.firstLoad = false;
			rpGMF.map.fitBounds(rpGMF.place_polygon.getBounds());
		}

		rpGMF.place_polygon_path = rpGMF.place_polygon.getPath()

		google.maps.event.addListener(rpGMF.place_polygon_path, 'set_at', rpGMF.polyChanged);

		google.maps.event.addListener(rpGMF.place_polygon_path, 'insert_at', rpGMF.polyChanged);
	},
	movePoly: function(poly){
		var newPath = rpGMF.pathToArray(poly);
		rpGMF.updateField(newPath);
		rpGMF.delPoly(poly);
		rpGMF.delPoly(rpGMF.place_polygon);
		rpGMF.drawPolygon(newPath);
	},
	updateField: function(path){
		$('#coordinates').val(JSON.stringify(path));
		$('#type').val('Polygon');
	},
	updateFieldMark: function(pos){
		$('#coordinates').val(JSON.stringify([pos.lng,pos.lat]));
		$('#type').val('Point');
	},
	drawMarker: function(pos){

		var mrkpos = new google.maps.LatLng(pos.lat,pos.lng);
		rpGMF.place_point = new google.maps.Marker({
			position: mrkpos,
			draggable: true,
			map: rpGMF.map
		});

		google.maps.event.addListener(rpGMF.place_point,'drag', function(event) {
			var gpos = rpGMF.place_point.getPosition();
			var pos = {lat: gpos.lat(), lng: gpos.lng()};
			rpGMF.updateFieldMark(pos);
		});

		if(rpGMF.firstLoad){
			rpGMF.firstLoad = false;
			rpGMF.map.setCenter(mrkpos)
			rpGMF.map.setZoom(8);
		}
	},
	moveMarker: function(marker){
		var gpos = marker.getPosition();
		var pos = {lat: gpos.lat(), lng: gpos.lng()};
		rpGMF.updateFieldMark(pos);
		if(rpGMF.place_point){
			rpGMF.place_point.setMap(null);
		}
		rpGMF.drawMarker(pos);
		 marker.setMap(null);
	},
	customBtn: function(){

		if(document.fullscreenEnabled){
			var controlDiv = document.createElement('div');
			controlDiv.index = 1;
			controlDiv.className = "gmnoprint custom-control-container";
			var controlUIContainer = document.createElement('div');
			var controlUI = document.createElement('div');
			controlUIContainer.className = "gm-style-mtc";
			controlDiv.appendChild(controlUIContainer);
			controlUI.className = "custom-control";
			controlUI.title = 'Toggle Full Screen';
			controlUI.innerHTML = 'Full Screen';
			controlUIContainer.appendChild(controlUI);

			google.maps.event.addDomListener(controlUI, 'click', function() {
				rpGMF.mapdom.toggleFullScreen();
			});

			rpGMF.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

		}

	}

};


$(function(){

	var mapOptions = {
		zoom: 2,
		center: {lat: 17, lng: -35},
		mapTypeId: google.maps.MapTypeId.HYBRID,
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			position: google.maps.ControlPosition.RIGHT_TOP
		}
	};
	
	rpGMF.map = new google.maps.Map(document.getElementById('location'), mapOptions);

	// first load
	if(place.type=='Polygon'){
		rpGMF.drawPolygon(place.coordinates);
	}else if(place.type=='Point'){
		rpGMF.drawMarker({
			lat:place.coordinates[1],
			lng:place.coordinates[0]
		});
	}


	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [
				google.maps.drawing.OverlayType.MARKER,
				google.maps.drawing.OverlayType.POLYGON,
			]
		},
		polygonOptions: {
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			clickable: false,
			editable: true,
			draggable: true,
			zIndex: 1
		}
	});
	drawingManager.setMap(rpGMF.map);

	google.maps.event.addListener(drawingManager, 'overlaycomplete', function (e) {
		drawingManager.setDrawingMode(null);
		if(e.type == google.maps.drawing.OverlayType.MARKER){
			if(rpGMF.place_polygon){
				rpGMF.delPoly(rpGMF.place_polygon);
			}
			rpGMF.moveMarker(e.overlay);
		}else if(e.type == google.maps.drawing.OverlayType.POLYGON){
			if(rpGMF.place_point){
				rpGMF.place_point.setMap(null);
			}
			rpGMF.movePoly(e.overlay);
		}
	});
	
	rpGMF.customBtn();

	$(document).bind("fullscreenchange", function() {
		var isfull = $(document).fullScreen();
		if(isfull){
			rpGMF.mapdom.addClass('fullscreen');
		}else{
			rpGMF.mapdom.removeClass('fullscreen');
		}
	});

	// Returns the area of a closed path. The computed area uses the same units as the radius. The radius defaults to the Earth's radius in meters, in which case the area is in square meters.
	// https://developers.google.com/maps/documentation/javascript/reference?csw=1#spherical
	// google.maps.geometry.spherical.computeArea(rpGMF.place_polygon.getPath());
});