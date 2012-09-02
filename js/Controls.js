
THREE.SphereControls = function ( camera, domElement ) {
	
	this.camera = camera;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	

	this.objectSettingsActive = false;
	
	this.mouseOrigin = new THREE.Vector2(0,0);
	this.mouseDown = false;
	this.keysDown = [];
	
	this.radius = 50;
	this.theta = -(Math.PI/4); //blickwinkel 0 < theta < pi
	this.phi = 0; //drehwinkel 0 < phi < 2pi
	this.oldTheta = 0;
	this.oldPhi = 0;
	
	this.lookAt = new THREE.Vector3(0,0,0);
	
	this.projector = new THREE.Projector();
	
	this.init = function ( ) {
	
		// constructor
		
	}
	
	this.update = function( ) {
		

		//move
		direction = camera.position.clone();
		direction.subSelf(this.lookAt);
		direction.setY(0);
		direction.normalize();
		
		scale = 0.5;
		
		if (this.keysDown[38]) {
			this.lookAt.z -= direction.z*scale;
			this.lookAt.x -= direction.x*scale;
		}
		if (this.keysDown[40]) {
			this.lookAt.z += direction.z*scale;
			this.lookAt.x += direction.x*scale;
		}
		if (this.keysDown[39]) {
			direction90 = new THREE.Vector3(-direction.z, 0, direction.x);
			this.lookAt.z -= direction90.z*scale;
			this.lookAt.x -= direction90.x*scale;		
		}
		if (this.keysDown[37]) {
			direction90 = new THREE.Vector3(-direction.z, 0, direction.x);
			this.lookAt.z += direction90.z*scale;
			this.lookAt.x += direction90.x*scale;
		}
		
		
		
		if (this.theta<-Math.PI/2) {this.theta = -Math.PI/2};
		if (this.theta>-0.1) {this.theta = -0.1};
		
		//console.log ("theta: "+this.theta+" phi: "+this.phi);
		camera.position.x = this.lookAt.x + this.radius*Math.sin(this.theta)*Math.cos(this.phi);
		camera.position.z = this.lookAt.z + this.radius*Math.sin(this.theta)*Math.sin(this.phi);
		camera.position.y = this.radius*Math.cos(this.theta);
		
		camera.lookAt(this.lookAt);
		camera.updateProjectionMatrix();
	}
	
	this.mousemove = function( event ) {
		if (this.mouseDown) {
			moveX = event.clientX-this.mouseOrigin.x;
			moveY = event.clientY-this.mouseOrigin.y;
			
			this.phi = this.oldPhi - moveX/200;
			this.theta = this.oldTheta + moveY/200;
		}		
	}
	
	this.mousedown = function( event ) {
		event.preventDefault();
		if (event.button==0) {
            this.mouseDown = true;
            this.mouseOrigin = new THREE.Vector2(event.clientX,event.clientY);
		}
	}
	
	this.mouseup = function( event ) {
		event.preventDefault();
		this.mouseDown = false;
		
		this.oldPhi = this.phi;
		this.oldTheta = this.theta;
		
	}
	
	this.mousewheel = function( event ) {
		event.preventDefault();
		
		var e = window.event || event; // old IE support  
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		this.radius -= delta;
		if (this.radius < 5) this.radius = 5;
		if (this.radius > 150) this.radius = 150;
		
	}
	this.keydown = function( event ) {
		event.preventDefault();
		this.keysDown[event.keyCode] = true;
		
	}
	this.keyup = function( event ) {
		event.preventDefault();
		this.keysDown[event.keyCode] = false;
		
	}
	
	this.contextmenu = function( event ) {
		event.preventDefault();
		this.mouseDown = false;
        var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        this.projector.unprojectVector( vector, this.camera );

        var ray = new THREE.Ray( this.camera.position, vector.subSelf( this.camera.position ).normalize() );

        var intersects = ray.intersectObjects( geometryObjects );
        

        if ( intersects.length > 0 && !selectedObject ) {
            
            selectedObject = intersects[0].object;
            
            
            
            if (selectedObject.material.color) {
            $("#object-settings #objectColor").miniColors('value', '#' + (selectedObject.material.color.r*255).toString(16)
                                                                       + (selectedObject.material.color.g*255).toString(16)
                                                                       + (selectedObject.material.color.b*255).toString(16));
                $("#object-settings .colorer").show();

            } else {
                $("#object-settings .colorer").hide();
            }
            
            
            $("#object-settings").dialog("option", "title", "Object Settings: "+selectedObject.name);
            
            if (geometryData.rows[selectedObject.number].value.type!="obstacle" ||
                selectedObject.name.indexOf("tree") != -1 || 
                selectedObject.name.indexOf("plant") != -1) {
                $("#object-settings .converter").hide();
            } else {
                $("#object-settings .converter").show();
            }
            $("#object-settings .code").text(geometryData.rows[selectedObject.number].value.type);
            $("#object-settings").dialog("open");

        }
		
	}
	
	function bind( scope, fn ) {
	
		return function () {
	
			fn.apply( scope, arguments );
	
		};
	
	};
	
	
	window.addEventListener( 'keydown', bind( this, this.keydown ), false );
	window.addEventListener( 'keyup',   bind( this, this.keyup ), false );
	
	this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
	this.domElement.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );
	// IE9, Chrome, Safari, Opera  
	this.domElement.addEventListener("mousewheel", bind( this, this.mousewheel ), false);  
	// Firefox  
	this.domElement.addEventListener("DOMMouseScroll", bind( this, this.mousewheel ), false);
	
	this.domElement.addEventListener("contextmenu", bind( this, this.contextmenu ), false); 
	
	
}

