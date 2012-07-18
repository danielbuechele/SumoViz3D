
$(function() {
	$( "#slider-range-min" ).slider({
		range: "min",
		value: 0,
		min: 0,
		max: animation.rows.length,
		slide: function( event, ui ) {
			console.log(ui.value);
			pedFrame = ui.value;
		}
	});

	$("#slider-range-min .ui-slider-handle").unbind('keydown');

	$('.ui-state-default').hover(
		function(){ $(this).addClass('ui-state-hover'); }, 
		function(){ $(this).removeClass('ui-state-hover'); }
	);

	$("#playbutton").click(function(){
		togglePlay();
	});

	$("#prevbutton").click(function(){
		pedFrame++;
		drawPedestrians();

	});

	$("#nextbutton").click(function(){
		pedFrame--;
		drawPedestrians();
	});
	
	$("#settingsbutton").click(function(){
		if ($("#settings").dialog("isOpen")) {
			$("#settings").dialog("close");
			$(this).removeClass("ui-state-active");
		} else {
			$("#settings").dialog("open");
			$(this).addClass("ui-state-active");
		}
	});
	
	$("#settings").dialog({
		close: function(event, ui) {$("#settingsbutton").removeClass("ui-state-active");},
		autoOpen: false,
		title: "Settings"
	});
	
	$("#showgrid").change(function () {drawGeometry()});
	$("#floortexture").change(function () {drawGeometry()});
	$("#walltexture").change(function () {drawGeometry()});

});


function downloadScreen() {
	console.log(renderer.domElement.toDataURL());
	
}


function togglePlay() {
	if (!isPlaying) {
		$("#playbutton span").removeClass("ui-icon-play");
		$("#playbutton span").addClass("ui-icon-pause");
	} else {
		$("#playbutton span").removeClass("ui-icon-pause");
		$("#playbutton span").addClass("ui-icon-play");
	}
	isPlaying = !isPlaying;
}


var renderer, scene, lookAt, camera, $container, numberPedestrians, geometrySize = {"x":0,"y":0};
var pedestrianObjects = [];
var plane;
var grid = [];
var geometryObjects = [];

isPlaying = true;

document.addEventListener( 'mousedown', mouseDown, false );
document.addEventListener( 'mouseup', mouseUp, false );
document.addEventListener( 'mousemove', mouseMove, false );
document.addEventListener( 'keydown', keyDown, false );
document.addEventListener( 'keyup', keyUp, false );


function init() {

	$container = $('#container');
	$("#frameCounter").text("0/"+animation.rows.length);

	// set the scene size
	var WIDTH = $container.width(),
		HEIGHT = $container.height();

	// set some camera attributes
	var VIEW_ANGLE = 45,
		ASPECT = WIDTH / HEIGHT,
		NEAR = 0.1,
		FAR = 1000;

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;


	camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
	scene = new THREE.Scene();


	//set geometry size
	for (i=0;i<geometryData.length;i++) {
		if (geometryData[i].type=="geometry") {
			for (j=0;j<geometryData[i].geometry.length;j++) {
				if (geometryData[i].geometry[j][0]>geometrySize.x) {geometrySize.x = geometryData[i].geometry[j][0];}
				if (geometryData[i].geometry[j][1]>geometrySize.y) {geometrySize.y = geometryData[i].geometry[j][1];}
			}
		}
	}


	lookAt = new THREE.Vector3( geometrySize.x/2, 0, geometrySize.y/2);
	camera.lookAt(lookAt);
	// the camera starts at 0,0,0 so pull it back
	camera.position.z = 20;
	camera.position.y = 20;


	//Stats element
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.right = '0px';
	$container.append( stats.domElement );


	// start the renderer
	renderer.setSize(WIDTH, HEIGHT);

	// attach the render-supplied DOM element
	$container.append(renderer.domElement);



	//grid
	lineSpacing = 2;
	linesMaterial = new THREE.LineBasicMaterial();
	linesMaterial.color = new THREE.Color( 0xb6b6b6);
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 0, 0 ) ) );
	lineGeometry.vertices.push( new THREE.Vertex( new THREE.Vector3( Math.ceil(geometrySize.x/lineSpacing)*lineSpacing, 0, 0 ) ) );
	for ( var i = 0; i <= Math.ceil(geometrySize.y/lineSpacing); i ++ ) {
		var line = new THREE.Line( lineGeometry, linesMaterial );
		line.position.z = ( i * lineSpacing );
		line.receiveShadow = true;
		scene.add( line );
		grid.push(line);
	}
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 0, 0 ) ) );
	geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 0, 0, Math.ceil(geometrySize.y/lineSpacing)*lineSpacing) ) );
	for ( var i = 0; i <= Math.ceil(geometrySize.x/lineSpacing); i ++ ) {
		var line = new THREE.Line( geometry, linesMaterial );
		line.position.x = ( i * lineSpacing );
		line.receiveShadow = true;
		scene.add( line );
		grid.push(line);
	}

	//Plane
	var planeGeo = new THREE.PlaneGeometry(Math.ceil(geometrySize.x/lineSpacing)*lineSpacing, Math.ceil(geometrySize.y/lineSpacing)*lineSpacing, 10, 10);
	plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({color: 0xdddddd}));
	plane.rotation.x = -Math.PI/2;
	plane.position = new THREE.Vector3( Math.ceil(geometrySize.x/lineSpacing)*lineSpacing/2, -.01, Math.ceil(geometrySize.y/lineSpacing)*lineSpacing/2);
	plane.receiveShadow = true;
	plane.doubleSided = true;
	scene.add(plane);


	// and the camera
	scene.add(camera);


	// LIGHTS
	light = new THREE.DirectionalLight(0xffffff,0.1);
	light.position = new THREE.Vector3(-2,5,-2).normalize(); 
	light.shadowCameraNear = 0.1;
	light.shadowCameraFar = 50;
	light.shadowDarkness = 0.1;
	light.shadowCameraLeft = 50;
	light.shadowCameraRight = -50;
	light.shadowCameraTop = 100;
	light.shadowCameraBottom = 0;
	light.shadowMapWidth = 10048;
	light.shadowMapHeight = 10048;

	//correcting shadow gap between walls und floor
	light.shadowBias = 0.002;
	light.castShadow = true;
	scene.add( light );

	var light = new THREE.SpotLight();
	light.position.set( 0, 10, 0 );
	scene.add(light);

	var light = new THREE.SpotLight();
	light.position.set( geometrySize.x, 10, geometrySize.y );
	scene.add(light);

	var light = new THREE.SpotLight();
	light.position.set( geometrySize.x/2, 200, geometrySize.y/2 );
	scene.add(light);



	drawGeometry();


	//create pedestrian Objects
	numberPedestrians = 0;
	for (i=0;i<animation.rows.length;i++) {
		if (animation.rows[i].value.length > numberPedestrians) numberPedestrians=animation.rows[i].value.length;
	}

	for (i=0;i<numberPedestrians;i++) {
		sphereMaterial = new THREE.MeshLambertMaterial();
		sphereMaterial.color.setHSV(hueForDensity(0),1,.7);
		var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.1,10,10),sphereMaterial);
		sphere.position.y=0.1;
		pedestrianObjects.push(sphere);
		scene.add(sphere);
		sphere.visible = false;

	}


	var lineMat = new THREE.LineBasicMaterial( { color: 0x0000ff, opacity: 1, linewidth: 3 } );


	// draw!
	setInterval(camLoop, 1000/30);
	setInterval(drawPedestrians, 1000/5);
	renderer.render(scene, camera);  
	
	//update on window resize
	var windowResize = THREEx.WindowResize(renderer, camera);
	    
	animate();
}


function getMaterialForTexture( path ) {

	if (path == "") {
		return new THREE.MeshBasicMaterial( { color : 0xdddddd } );
	}
	
	var planeTex = new THREE.ImageUtils.loadTexture(path);
	planeTex.wrapS = planeTex.wrapT = THREE.RepeatWrapping;
	planeTex.repeat.set(5, 5);
	mat = new THREE.MeshBasicMaterial({ map : planeTex });
	mat.needsUpdate = true;
	
	return mat;
	
}



function drawGeometry() {
	
	//Plane texture
	plane.material = getMaterialForTexture($("#floortexture").val());
	

	//grid
	if ($("#showgrid").attr('checked')) {
		console.log("show grid");
		for (i = 0;i<grid.length;i++) {
			grid[i].visible = true;
		}
	} else {
		console.log("show grid");
		for (i = 0;i<grid.length;i++) {
			grid[i].visible = false;
		}
	}
	
	

	//draw geomety
	for (i=0;i<geometryData.length;i++) {
		console.log(i);
		//make 2-point-obstacles to walls
		if (geometryData[i].geometry.length < 3 && geometryData[i].type=="obstacle") geometryData[i].type="wall";
		
		//render OBSTACLES
		if (geometryData[i].type=="obstacle" && !geometryObjects[i]) {
			
			polygonPoints = [[0,0]];
			for (j=0;j<geometryData[i].geometry.length;j++) {
				polygonPoints.push(new THREE.Vector2(geometryData[i].geometry[j][0],geometryData[i].geometry[j][1]));
			}

			var solid = new THREE.ExtrudeGeometry( new THREE.Shape( polygonPoints ), { amount: geometryData[i].height, bevelEnabled: false });
			mesh = new THREE.Mesh(solid,  new THREE.MeshLambertMaterial({color: 0x345089})),
			mesh.position.set( 0, geometryData[i].height, 0 );
			mesh.rotation.set(Math.PI/2,0,0);
			mesh.castShadow  = true;
			scene.add(mesh);
			geometryObjects[i] = mesh;
		
		//render WALLS
		} else if (geometryData[i].type=="wall" && !geometryObjects[i]) {
			
			wallDepth = 0.07;
			wallHeight = 1;
			var mesh = new THREE.Mesh(new THREE.CubeGeometry(0,0,0), new THREE.MeshLambertMaterial());
			
			for (j=0;j<geometryData[i].geometry.length;j++) {
				if (geometryData[i].geometry[j+1]) {
					
					a = new THREE.Vector2(geometryData[i].geometry[j][0],geometryData[i].geometry[j][1]);
					b = new THREE.Vector2(geometryData[i].geometry[j+1][0],geometryData[i].geometry[j+1][1]);
					
					move = new THREE.Vector2(a.x,a.y);
					move.subSelf(b);
					move.set(-move.y,move.x);
					move.normalize();
					var shape = new THREE.Shape();
					shape.moveTo(a.x,a.y);
					shape.lineTo(b.x,b.y);
					shape.lineTo(b.x+wallDepth*move.x, b.y+wallDepth*move.y);
					shape.lineTo(a.x+wallDepth*move.x, a.y+wallDepth*move.y);
					shape.lineTo(a.x,a.y);
					
					var solid = new THREE.ExtrudeGeometry(shape, { amount: wallHeight, bevelEnabled: false });
					addmesh = new THREE.Mesh(solid, new THREE.MeshLambertMaterial());
					addmesh.rotation.x = Math.PI/2;
					addmesh.position.y = wallHeight;
					
					
					THREE.GeometryUtils.merge(mesh.geometry,addmesh);

				}
			}
			
			mesh.geometry.computeBoundingSphere();
			//mesh.doubleSided = true;
			mesh.castShadow = true;
			scene.add(mesh);
			geometryObjects.push(mesh);
			
			
			
		//render SOURCE
		} else if (geometryData[i].type=="source" && !geometryObjects[i]) {

			polygonPoints = [[0,0]];
			for (j=0;j<geometryData[i].geometry.length;j++) {
				polygonPoints.push(new THREE.Vector2(geometryData[i].geometry[j][0],geometryData[i].geometry[j][1]));
			}

			var solid = new THREE.ExtrudeGeometry( new THREE.Shape( polygonPoints ), { amount: 0.01, bevelEnabled: false });
			mesh = new THREE.Mesh(solid,  new THREE.MeshLambertMaterial({color: 0xba2222}));
			mesh.position.set( 0, 0, 0 );
			mesh.rotation.set(Math.PI/2,0,0);
			mesh.castShadow  = true;
			scene.add(mesh);
			geometryObjects[i] = mesh;

		//render TARGET
		} else if (geometryData[i].type=="target" && !geometryObjects[i]) {

			polygonPoints = [[0,0]];
			for (j=0;j<geometryData[i].geometry.length;j++) {
				polygonPoints.push(new THREE.Vector2(geometryData[i].geometry[j][0],geometryData[i].geometry[j][1]));
			}

			var solid = new THREE.ExtrudeGeometry( new THREE.Shape( polygonPoints ), { amount: 0.01, bevelEnabled: false });
			mesh = new THREE.Mesh(solid,  new THREE.MeshLambertMaterial({color: 0xb9aa08}));
			mesh.position.set( 0, 0, 0 );
			mesh.rotation.set(Math.PI/2,0,0);
			mesh.castShadow  = true;
			scene.add(mesh);
			geometryObjects[i] = mesh;
		}
		
	}
	
	
	//wall texture
	for (i=0;i<geometryData.length;i++) {
		if (geometryData[i].type == "wall") {
			var texture = new THREE.ImageUtils.loadTexture($("#walltexture").val());
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(1, 1);
			geometryObjects[i].material = new THREE.MeshLambertMaterial({map: texture});
		}
	}
	
	renderer.render(scene, camera); 

}



function hueForDensity(density){
	scaler = 2;
	return (105-105*density*scaler)/360;
}



var frame = 0;
var t = 0;
function animate(){

	requestAnimationFrame( animate );
	camera.lookAt( lookAt );
	renderer.render( scene, camera );
	frame++;
	stats.update();
}



function camLoop () {

	//pan and tilt

	if (mouseDown) {
			
		var radius = 18;
		t += 0.2*(mouseX-mouseOriginX)/$container.width();
		camera.position.x = lookAt.x + radius * Math.sin(t%(2*Math.PI));
		camera.position.z = lookAt.z + radius * Math.cos(t%(2*Math.PI));

		camera.position.y += 8*(mouseY-mouseOriginY)/$container.height();
		if (camera.position.y<5) {camera.position.y=5;}
		if (camera.position.y>80) {camera.position.y=80;}
	}


	//move
	direction = camera.position.clone();
	direction.subSelf(lookAt);
	direction.setY(0);
	direction.normalize();

	scale = 0.5;

	if (keysDown[38]) {
		lookAt.z -= direction.z*scale;
		lookAt.x -= direction.x*scale;
		camera.position.z -= direction.z*scale;
		camera.position.x -= direction.x*scale;
	}
	if (keysDown[40]) {
		lookAt.z += direction.z*scale;
		lookAt.x += direction.x*scale;
		camera.position.z += direction.z*scale;
		camera.position.x += direction.x*scale;
	}
	if (keysDown[39]) {
		direction90 = new THREE.Vector3(-direction.z, 0, direction.x);
		lookAt.z -= direction90.z*scale;
		lookAt.x -= direction90.x*scale;
		camera.position.z -= direction90.z*scale;
		camera.position.x -= direction90.x*scale;		
	}
	if (keysDown[37]) {
		direction90 = new THREE.Vector3(-direction.z, 0, direction.x);
		lookAt.z += direction90.z*scale;
		lookAt.x += direction90.x*scale;
		camera.position.z += direction90.z*scale;
		camera.position.x += direction90.x*scale;
	}

	//don't walk out of geometry

	/*
	if (lookAt.z < 0 ) lookAt.z = 0;
	if (lookAt.x < 0 ) lookAt.x = 0;
	if (lookAt.z > geometrySize.y ) lookAt.z = geometrySize.y;
	if (lookAt.x > geometrySize.x ) lookAt.x = geometrySize.x;
*/
}

var pedFrame = 0;
function drawPedestrians() {

	if (animation.rows[pedFrame]) {

		for (i=0;i<numberPedestrians;i++) {

			if (animation.rows[pedFrame].value[i]) {
				pedestrianObjects[i].visible = true;
				pedestrianObjects[i].position.x = animation.rows[pedFrame].value[i][1][0];
				pedestrianObjects[i].position.z = animation.rows[pedFrame].value[i][1][1];
				pedestrianObjects[i].material.color.setHSV(hueForDensity( animation.rows[pedFrame].value[i][1][2]),1,.7);

			} else {
				pedestrianObjects[i].visible = false;

			}

		}

		$("#slider-range-min").slider('value', pedFrame);
		$('#frameCounter').text(pedFrame+"/"+animation.rows.length);
		if (isPlaying) pedFrame++;
	} else {
		//hide all objects
		for (i=0;i<numberPedestrians;i++) {pedestrianObjects[i].visible = false;}
		togglePlay();
		pedFrame = 0;
		$("#slider-range-min").slider('value', 0);
		$('#frameCounter').text("0/"+animation.rows.length);
		//TODO: cancel timer
	}
}

var mouseDown = false;
var mouseOriginX;
var mouseOriginY;
function mouseDown(event) {
	
	if (event.target.tagName=="CANVAS") {
		event.preventDefault();
		mouseDown = true;
		mouseOriginX = event.clientX;
		mouseOriginY = event.clientY;
	}
}


function mouseUp(event) {
	event.preventDefault();
	mouseDown = false;
}

var mouseX = 0;
var mouseY = 0;
function mouseMove(event) {
	event.preventDefault();
	mouseX = event.clientX;
	mouseY = event.clientY;


}


var keysDown = [];
function keyDown(event) {
	event.preventDefault();
	keysDown[event.keyCode] = true;
}

function keyUp(event) {
	event.preventDefault();
	keysDown[event.keyCode] = false;
}

init();
