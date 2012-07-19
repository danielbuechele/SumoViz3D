
THREE.SphereControls = function ( camera, domElement ) {
	
	this.camera = camera;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	
	
	this.mouseOrigin = new THREE.Vector2(0,0);
	this.mouseDown = false;
	this.keysDown = [];
	
	this.radius = 50;
	this.theta = -(Math.PI/4); //blickwinkel 0 < theta < pi
	this.phi = 0; //drehwinkel 0 < phi < 2pi
	this.oldTheta = 0;
	this.oldPhi = 0;
	
	this.lookAt = new THREE.Vector3(0,0,0);
	
	
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
		this.mouseDown = true;
		this.mouseOrigin = new THREE.Vector2(event.clientX,event.clientY);
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
	
	this.domElement.addEventListener("contextmenu", bind( this, this.keyup ), false); 
	
	
	


	
}





/*




function camLoop() {
	
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

*/
