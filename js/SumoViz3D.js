
$(function() {
	$( "#slider-range-min" ).slider({
		range: "min",
		value: 0,
		min: 0,
		max: pedestrianData.rows.length,
		slide: function( event, ui ) {
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
		updatePedestrians();

	});

	$("#nextbutton").click(function(){
		pedFrame--;
		updatePedestrians();
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
	
	$("a.button").button();
	
	$("#objectColor").miniColors({
	   change: function(hex,rgb) {
	       colorObject({"r":rgb.r/255,"g":rgb.g/255,"b":rgb.b/255});
	   }
	});
	
	$("#object-settings").dialog({
		close: function(event, ui) {
            selectedObject = null;
		},
		autoOpen: false,
		title: "Object settings"
	});
	
	$("#showgrid").change(function () {drawGeometry()});
	$("#floortexture").change(function () {drawGeometry()});
	$("#walltexture").change(function () {drawGeometry()});
    $("#pedestriancoloring").change(function () {
        coloringChanged();
    });
});


function downloadScreen() {
	console.log(renderer.domElement.toDataURL());
	
}

function colorByGroups() {

    for (i=0;i<groupData.rows.length;i++) {
        for (j=0;j<groupData.rows[i].value.length;j++) {
            if (particles.colors[groupData.rows[i].value[j]]) particles.colors[groupData.rows[i].value[j]].setHSV((173*i/360)%1,1,1);
        }
    }
}

function coloringChanged() {
    window.localStorage.setItem(filename+'_pedestrianColoring',$("#pedestriancoloring").val());
    
    if ($("#pedestriancoloring").val()=="groups" && groupData) {
        $("#scale-coloring").hide();
        colorByGroups();
    } else if ($("#pedestriancoloring").val()=="speed") {
        $("#scale-coloring").show();
        $("#scale-coloring .colortype").text('speed');
        $("#scale-coloring .colorspace").removeClass('color-density');
        $("#scale-coloring .colorspace").addClass('color-speed');
        
    } else if ($("#pedestriancoloring").val()=="density") {
        $("#scale-coloring").show();
        $("#scale-coloring .colortype").text('density');
        $("#scale-coloring .colorspace").removeClass('color-speed');
        $("#scale-coloring .colorspace").addClass('color-density');
        
    }
}

function deleteObject(myObject) {
    console.log("delete");
    if (!myObject) myObject = selectedObject;

    myObject.visible = false;    
    
    //save settings
    tempobjsettings = readObjectSettings();
    if (tempobjsettings[myObject.number]) tempobjsettings[myObject.number].deleted = "yes";
    else tempobjsettings[myObject.number] = {"deleted":"yes"};
    saveObjectSettings(tempobjsettings);
    
    $("#object-settings").dialog("close");
}

function colorObject(color, myObject) {
    
    if (!myObject) myObject = selectedObject;
    
    if (!myObject.material.color) return;
    
    myObject.material.color = color;
    
    //save settings
    tempobjsettings = readObjectSettings();
    if (tempobjsettings[myObject.number]) tempobjsettings[myObject.number].color = myObject.material.color;
    else tempobjsettings[myObject.number] = {"color":myObject.material.color};
    saveObjectSettings(tempobjsettings);
    
}


function saveObjectSettings(myObject) {
    window.localStorage.setItem(filename+'_objectSettings',JSON.stringify(myObject));
}

function readObjectSettings() {
    if (JSON.parse(window.localStorage.getItem(filename+'_objectSettings'))) {
        return JSON.parse(window.localStorage.getItem(filename+'_objectSettings'));
    } else {
        return [];
    }
} 


function convertObject(to, myObject) {

    if (!myObject) myObject = selectedObject;
        
    scene.remove(geometryObjects[parseInt(myObject.number)]);
    geometryData.rows[parseInt(myObject.number)].value.name = to+"_"+geometryData[parseInt(myObject.number)].name;
    geometryData.rows[parseInt(myObject.number)].value.type = "obstacle"; //not necessary as only obstacles are convertable
    geometryObjects[parseInt(myObject.number)] = null;
    
    //save settings
    tempobjsettings = readObjectSettings();
    if (tempobjsettings[myObject.number]) tempobjsettings[myObject.number].convert = to;
    else tempobjsettings[myObject.number] = {"convert":to};
    saveObjectSettings(tempobjsettings);
    
    drawGeometry();
    $("#object-settings").dialog("close");

}

function loadSettings() {
    //load settings from localSotrage
    
    //show grid?
    if (window.localStorage.getItem(filename+'_showGrid')=="no") {
        $("#showgrid").attr('checked', false);;
    } else {
        $("#showgrid").attr('checked', true);
    }
    
    $('#floortexture option[value="'+window.localStorage.getItem(filename+'_floorTexture')+'"]').attr('selected', 'selected');
    
    $('#walltexture option[value="'+window.localStorage.getItem(filename+'_wallTexture')+'"]').attr('selected', 'selected');
    
    $('#pedestriancoloring option[value="'+window.localStorage.getItem(filename+'_pedestrianColoring')+'"]').attr('selected', 'selected');
    //if ($("#pedestriancoloring").val()=="groups" && groupData) {colorByGroups();}
    coloringChanged();
    drawGeometry();
}

function clearSettings() {
    window.localStorage.clear();
    window.location.href = document.URL;
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

var controls;

var pedestrianModel;

var selectedObject;

var globalScale;

var loader = new THREE.ColladaLoader();

isPlaying = false;


function init() {

	$container = $('#container');
	$("#frameCounter").text("0/"+pedestrianData.rows.length);
    
	
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
	for (i=0;i<geometryData.rows.length;i++) {
		if (geometryData.rows[i].value.type=="geometry") {
			for (j=0;j<geometryData.rows[i].value.geometry.length;j++) {
				if (geometryData.rows[i].value.geometry[j][0]>geometrySize.x) {geometrySize.x = geometryData.rows[i].value.geometry[j][0];}
				if (geometryData.rows[i].value.geometry[j][1]>geometrySize.y) {geometrySize.y = geometryData.rows[i].value.geometry[j][1];}
			}
		}
	}
	
	
	//set global scale
	globalScale = 1/((geometrySize.x+geometrySize.y)/100);
	
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
	lineSpacing = 1;
	linesMaterial = new THREE.LineBasicMaterial();
	linesMaterial.color = new THREE.Color( 0xb6b6b6);
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	lineGeometry.vertices.push( new THREE.Vector3( Math.ceil(geometrySize.x*globalScale/lineSpacing)*lineSpacing, 0, 0 ) );
	for ( var i = 0; i <= Math.ceil(geometrySize.y*globalScale/lineSpacing); i ++ ) {
		var line = new THREE.Line( lineGeometry, linesMaterial );
		line.position.z = ( i * lineSpacing );
		line.receiveShadow = true;
		scene.add( line );
		grid.push(line);
	}
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	geometry.vertices.push( new THREE.Vector3( 0, 0, Math.ceil(geometrySize.y*globalScale/lineSpacing)*lineSpacing) );
	for ( var i = 0; i <= Math.ceil(geometrySize.x*globalScale/lineSpacing); i ++ ) {
		var line = new THREE.Line( geometry, linesMaterial );
		line.position.x = ( i * lineSpacing );
		line.receiveShadow = true;
		scene.add( line );
		grid.push(line);
	}
	
	//set grid pitch meter
	$("#scale span").text(Math.round(lineSpacing/globalScale*100)/100+" m");

	//Plane
	var planeGeo = new THREE.PlaneGeometry(Math.ceil(geometrySize.x*globalScale/lineSpacing)*lineSpacing, Math.ceil(geometrySize.y*globalScale/lineSpacing)*lineSpacing, 10, 10);
	plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({color: 0xdddddd}));
	plane.rotation.x = -Math.PI/2;
	plane.position = new THREE.Vector3( Math.ceil(geometrySize.x*globalScale/lineSpacing)*lineSpacing/2, -.01, Math.ceil(geometrySize.y*globalScale/lineSpacing)*lineSpacing/2);
	plane.receiveShadow = true;
	scene.add(plane);  


	// and the camera
	scene.add(camera);


	// LIGHTS
	
	light = new THREE.DirectionalLight(0xffffff,1.0,0.0);
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

/*
    renderer.shadowMapEnabled = true;
	//correcting shadow gap between walls und floor
	light.shadowBias = 0.002;*/
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
    
    
	controls = new THREE.SphereControls(camera, renderer.domElement);
	controls.lookAt = new THREE.Vector3(geometrySize.x/2*globalScale,0,geometrySize.y/2*globalScale);
    
    
	


	//create pedestrian Objects
	numberPedestrians = 0;
	maxPedestrianId = -1;
	for (i=0;i<pedestrianData.rows.length;i++) {
		if (pedestrianData.rows[i].value.length > numberPedestrians) numberPedestrians = pedestrianData.rows[i].value.length;
		if (pedestrianData.rows[i].value[pedestrianData.rows[i].value.length-1][3] > maxPedestrianId) maxPedestrianId = pedestrianData.rows[i].value[pedestrianData.rows[i].value.length-1][3];
	}

    particles = new THREE.Geometry(),
    pMaterial = new THREE.ParticleBasicMaterial({
        color: 0xffffff,
        size: 2*globalScale,
        map: THREE.ImageUtils.loadTexture("img/ball.png"),
        transparent : true,
        alphaTest: 0.5,
        vertexColors: true
    });
	var colors=[];
	// now create the individual particles
	for(var p = 0; p <= maxPedestrianId; p++) {

        particle = new THREE.Vector3(100000, 0.5*globalScale, 0); //render out of sight
		particle.velocity = new THREE.Vector3(0,0,0);
		
		// add it to the geometry
		particles.vertices.push(particle);
		pedestrianObjects.push(particle);
		colors[ p ] = new THREE.Color( 0xffffff );
		//colors[ p ].setRGB( Math.random(),Math.random(),Math.random() );
	}
	
	// create the particle system
	particles.colors = colors;

	var particleSystem = new THREE.ParticleSystem(particles,pMaterial);
    	
	// add it to the scene
	scene.add(particleSystem);
	
	
	
    //settings must be loaded before geometry is drawn first time
    loadSettings();
    
    drawGeometry();
    
    

	// draw!
	setInterval(updatePedestrians, 1000/5);
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
	
    //save settings
    if($("#showgrid").attr("checked")) {
        window.localStorage.setItem(filename+'_showGrid','yes');
        $("#scale").show();
    } else {
        window.localStorage.setItem(filename+'_showGrid','no');
        $("#scale").hide();
    }
    
    window.localStorage.setItem(filename+'_wallTexture',$("#walltexture").val());
    window.localStorage.setItem(filename+'_floorTexture',$("#floortexture").val());
    
    //load convert-settings
    for (i=0;i<readObjectSettings().length;i++) {
        if (readObjectSettings()[i]) {
            if (readObjectSettings()[i].convert) {geometryData.rows[i].value.name = readObjectSettings()[i].convert;}
        }
    }


	//Plane texture
	plane.material = getMaterialForTexture($("#floortexture").val());
	treeBuffer = [];
	plantBuffer = [];

	//grid
	if ($("#showgrid").attr('checked')) {
		for (i = 0;i<grid.length;i++) {
			grid[i].visible = true;
		}
	} else {
		for (i = 0;i<grid.length;i++) {
			grid[i].visible = false;
		}
	}
	

	//draw geomety
	for (i=0;i<geometryData.rows.length;i++) {
		//make 2-point-obstacles to walls
		if (geometryData.rows[i].value.geometry.length < 3 && geometryData.rows[i].value.type=="obstacle") geometryData.rows[i].value.type="wall";
		
		//render OBSTACLES
		if (geometryData.rows[i].value.type=="obstacle" && !geometryObjects[i]) {
			
			if (geometryData.rows[i].value.name.indexOf("tree") != -1) {
                //render TREE
                
                //must be defined to avoid race-conditions
                treeBuffer.push(i);

                loader.load( './models/tree.dae', function (result){
                    model = result.scene.children[1];
                    tI = treeBuffer.shift();
                    if(!tI) return;     
                    model.scale.set(4*globalScale,4*globalScale,4*globalScale);

                    sX=0;sY=0;
                    console.log(tI);
                    for (j=0;j<geometryData.rows[tI].value.geometry.length;j++) {
                        sX += geometryData.rows[tI].value.geometry[j][0];
                        sY += geometryData.rows[tI].value.geometry[j][1];
                    }

                    model.position.set(sX/geometryData.rows[tI].value.geometry.length*globalScale,2*globalScale,(-sY/geometryData.rows[tI].value.geometry.length+geometrySize.y)*globalScale);
                    model.name = geometryData.rows[tI].value.name;
                    //model.castShadow = true;
                    scene.add(model);
                    geometryObjects[tI] = model;

                    geometryObjects[tI].number = tI;

                
                });
                
                
			} else if (geometryData.rows[i].value.name.indexOf("plant") != -1) {
                //render PLANT
                
                //must be defined to avoid race-conditions
                plantBuffer.push(i);
                console.log(i);
                loader.load( './models/bush.dae', function (result){
                    
                    model = result.scene.children[1];
                    pI = plantBuffer.shift();
                    if(!pI) return;                    
                    model.scale.set(globalScale,globalScale,globalScale);
                    
                    sX=0;sY=0;
                    for (j=0;j<geometryData.rows[pI].value.geometry.length;j++) {
                        sX += geometryData.rows[pI].value.geometry[j][0];
                        sY += geometryData.rows[pI].value.geometry[j][1];
                    }

                    model.position.set(sX/geometryData.rows[pI].value.geometry.length*globalScale,0.3*globalScale,(-sY/geometryData.rows[pI].value.geometry.length+geometrySize.y)*globalScale);
                    model.name = geometryData.rows[pI].value.name;
                    
                    scene.add(model);
                    geometryObjects[pI] = model;
                    geometryObjects[pI].number = pI;
                
                });
                
                
			} else {
                //render OBSTACLE
                polygonPoints = [];
                for (j=0;j<geometryData.rows[i].value.geometry.length;j++) {
                    polygonPoints.push(new THREE.Vector2(geometryData.rows[i].value.geometry[j][0],-geometryData.rows[i].value.geometry[j][1]+geometrySize.y));
                }
    
                var solid = new THREE.ExtrudeGeometry( new THREE.Shape( polygonPoints ), { amount: parseInt(geometryData.rows[i].value.height)*globalScale, bevelEnabled: false });
                mesh = new THREE.Mesh(solid,  new THREE.MeshLambertMaterial({color: 0x345089})),
                mesh.position.set( 0, parseFloat(geometryData.rows[i].value.height)*globalScale, 0 );
                mesh.rotation.set(Math.PI/2,0,0);
                mesh.scale.set(globalScale,globalScale,1);
                mesh.castShadow  = true;
                mesh.name = geometryData.rows[i].value.name;
                scene.add(mesh);
                
                geometryObjects[i] = mesh;
                geometryObjects[i].number = i;
            }
		//render WALLS
		} else if (geometryData.rows[i].value.type=="wall" && !geometryObjects[i]) {
			
			wallDepth = 0.07*globalScale;
			wallHeight = 1*globalScale;
			var mesh = new THREE.Mesh(new THREE.CubeGeometry(0,0,0), new THREE.MeshLambertMaterial());
			
			for (j=0;j<geometryData.rows[i].value.geometry.length;j++) {
				if (geometryData.rows[i].value.geometry[j+1]) {
					
					a = new THREE.Vector2(geometryData.rows[i].value.geometry[j][0]*globalScale,(-geometryData.rows[i].value.geometry[j][1]+geometrySize.y)*globalScale);
					b = new THREE.Vector2(geometryData.rows[i].value.geometry[j+1][0]*globalScale,(-geometryData.rows[i].value.geometry[j+1][1]+geometrySize.y)*globalScale);
					
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
			mesh.name = geometryData.rows[i].value.name;
			mesh.castShadow = true;
			scene.add(mesh);
			geometryObjects[i] = mesh;
            geometryObjects[i].number = i;
			
			
			
		//render SOURCE, TARGET, FIELD
		} else if (geometryData.rows[i].value.type!="geometry" && !geometryObjects[i]) {

			polygonPoints = [];
			for (j=0;j<geometryData.rows[i].value.geometry.length;j++) {
				polygonPoints.push(new THREE.Vector2(geometryData.rows[i].value.geometry[j][0]*globalScale,(-geometryData.rows[i].value.geometry[j][1]+geometrySize.y)*globalScale));
			}

			var solid = new THREE.ExtrudeGeometry( new THREE.Shape( polygonPoints ), { amount: 0.001, bevelEnabled: false });
			
			mesh = new THREE.Mesh(solid,  new THREE.MeshBasicMaterial({color: 0xba2222}));
			mesh.position.set( 0, 0, 0 );
			mesh.rotation.set(Math.PI/2,0,0);
			mesh.material.opacity = 0.4;
			mesh.material.transparent = true;
			mesh.name = geometryData.rows[i].value.name;
			scene.add(mesh);
			geometryObjects[i] = mesh;
            geometryObjects[i].number = i;

		}
		
	}
	
	//wall texture
	var texture = new THREE.ImageUtils.loadTexture($("#walltexture").val());
	for (i=0;i<geometryData.rows.length;i++) {
		if (geometryData.rows[i].value.type == "wall") {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(1, 1);
			geometryObjects[i].material = new THREE.MeshLambertMaterial({map: texture});
			
		}
	}
	
	
    //load color and visibility-settings
    for (i=0;i<readObjectSettings().length;i++) {
        if (readObjectSettings()[i] && geometryObjects[i]) {
            if (readObjectSettings()[i].color && geometryObjects[i].material) {colorObject(readObjectSettings()[i].color,geometryObjects[i]);}
            if (readObjectSettings()[i].deleted=="yes") {deleteObject(geometryObjects[i]);}
        }
    }

}



function hueForDensity(density){
    // 0<=density<=1
	scaler = 2;
	return (105-105*density*scaler)/360;
}

function hueForSpeed(speed){
	// 0<=speed<=30
	scaler = 4;
	return (360-speed*scaler)/360;
}


function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
	stats.update();
}


var pedFrame = 0;
var lastSeen = [];


function updatePedestrians() {

	if (pedestrianData.rows[pedFrame]) {

		for (i=0;i<=maxPedestrianId;i++) {

			if (pedestrianData.rows[pedFrame].value[i]) {
				pedestrianObjects[i].x = pedestrianData.rows[pedFrame].value[i][0]*globalScale;
				pedestrianObjects[i].z = (-pedestrianData.rows[pedFrame].value[i][1]+geometrySize.y)*globalScale;
				
				if ($("#pedestriancoloring").val()=="density") {
				    particles.colors[i].setHSV(hueForDensity( pedestrianData.rows[pedFrame].value[i][2]),1,1);
				} else if ($("#pedestriancoloring").val()=="speed") {
				    
				    if (!lastSeen[pedestrianData.rows[pedFrame].value[i][3]] ||
				        pedFrame-lastSeen[pedestrianData.rows[pedFrame].value[i][3]][0]<1) {
                        //previous point not available => color gray
                        particles.colors[i].setRGB(0.7,0.7,0.7);
				    } else {
				        oldX = pedestrianData.rows[lastSeen[pedestrianData.rows[pedFrame].value[i][3]][0]].value[lastSeen[pedestrianData.rows[pedFrame].value[i][3]][1]][0]*globalScale;
                        oldZ = pedestrianData.rows[lastSeen[pedestrianData.rows[pedFrame].value[i][3]][0]].value[lastSeen[pedestrianData.rows[pedFrame].value[i][3]][1]][1]*globalScale;
                        
                        distance = Math.sqrt(Math.pow((pedestrianObjects[i].x-oldX),2)+Math.pow((pedestrianObjects[i].z-oldZ),2));
                        
                        speed = distance/(pedFrame-lastSeen[pedestrianData.rows[pedFrame].value[i][3]][0]);
                        particles.colors[i].setHSV(hueForSpeed(speed),1,1);
				    }
				    
				    
				}
                
                
                
                if (isPlaying) lastSeen[pedestrianData.rows[pedFrame].value[i][3]] = [pedFrame,i];
                
			} else {
				//pedestrianObjects[i].visible = false;
                pedestrianObjects[i].x = 100000; //move out of view
				pedestrianObjects[i].z = 0;
				
			}

		}
		
		particles.verticesNeedUpdate = true;
		particles.colorsNeedUpdate = true;

		$("#slider-range-min").slider('value', pedFrame);
		$('#frameCounter').text(pedFrame+"/"+pedestrianData.rows.length);
		if (isPlaying) pedFrame++;
	} else {
		//hide all objects
		for (i=0;i<numberPedestrians;i++) {pedestrianObjects[i].visible = false;}
		togglePlay();
		pedFrame = 0;
		lastSeen = [];
		$("#slider-range-min").slider('value', 0);
		$('#frameCounter').text("0/"+pedestrianData.rows.length);
		//TODO: cancel timer
	}
}


init();
