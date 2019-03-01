
let gl;
let program;

let normals, flatNormals;

let defMatProp=[
	[vec4( 0.8, 0.0, 0.0, 1.0), vec4(1.0, 0.3, 0.3, 1.0), vec4(1.0, 0.8, 0.8, 1.0), 5.0],
	[vec4( 0.0, 1.0, 1.0, 1.0), vec4(0.5, 1.0, 1.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), 5.0],
	[vec4( 0.1, 0.1, 0.1, 1.0), vec4(0.5, 0.5, 0.5, 1.0), vec4(1.0, 1.0, 1.0, 1.0), 40.0],
	[vec4( 0.5, 0.0, 1.0, 1.0), vec4(0.5, 0.3, 1.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), 20.0],
];
let matProp;
let theta = 0;
let spotLAngle;
const spotLAngInc = -0.005;
let isIncr = 1;
let trPar = [0, 0, 0];

const fovy = 30.0;
let initEye;
let initAt;
let objMiddle;
let flatShadOn = 0;

let mvMatrixLoc;

let lightPosition = vec4(8.0, 5.0, -20.0, 0.0 );
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
let lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
let lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

let shadowsOn;

let reflectionOn;
let refractionOn;

function add(n1, n2) {
	return n1 + n2;
}

class Stack {
	constructor() {
		this.stack = [];
		this.totalRot = [];
	}

	push(mat, rot) {
		this.stack.push(mat);
		this.totalRot.push(rot);
	}

	pop() {
		this.totalRot.pop();
		return this.stack.pop();
	}

	calcRot(newRot) {
		let sum = this.totalRot.reduce(add);
		return -sum + newRot;
	}
}

let mvMatrix;

let transXOn_isRi = [0, 0], transYOn_isUp = [0, 0], transZOn_isFr = [0, 0], rotOn = 1;

	let canvas;

let vertex_buffer;

function initVar() {
	transXOn_isRi = [0, 0], transYOn_isUp = [0, 0], transZOn_isFr = [0, 0], rotOn = 1;
	theta = 0;
	isIncr = 1;
	trPar = [0, 0, 0];
	extents_lrbtnf = [-1, 1, -1, 1, 1, -1];
	indices = [];
	vertices = [];
	totFilesRead = 0;
	spotLAngle = 0.89;
	reflectionOn = 0.0;
	refractionOn = 0.0;
	shadowsOn = 0.0;
	texOn = 1.0;
}

function setup() {
	initVar();
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");

	// We tell WebGL which shader program to execute.
	gl.useProgram(program);

	gl.uniform4fv(gl.getUniformLocation(program,
		"lightPosition"), flatten(lightPosition));

}


function main() {
	handleKeys();
	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.enable(gl.DEPTH_TEST);

	// handle having 1 or 2 shapes
	if (indices.length === 2) {
		indices = [indices[0], indices[1], indices[0], indices[1], indices[0], indices[1]];
		vertices = [vertices[0], vertices[1], vertices[0], vertices[1], vertices[0], vertices[1]];
	} else if (indices.length === 1) {
		indices = [indices[0], indices[0], indices[0], indices[0], indices[0], indices[0]];
		vertices = [vertices[0], vertices[0], vertices[0], vertices[0], vertices[0], vertices[0]];
	}


	// Define material properties for shapes
	matProp = [];
	for (let i = 0; i < indices.length; i++) {
		matProp.push(defMatProp[i%defMatProp.length]);
	}

	// calculate normals
	normals = [];
	flatNormals = [];
	for (let i = 0; i < vertices.length; i++) {
		let temp = [];
		for (let j = 0; j < vertices[i].length; j++) {
			temp.push([vertices[i][j][0], vertices[i][j][1], vertices[i][j][2], 0]);
		}
		normals.push(temp);
	}
	for (let i = 0; i < vertices.length; i++) { // flat normals
		let temp = [];
		for (let j = 0; j < vertices[i].length; j += 3) {
			const temp2 = [vertices[i][j][0], vertices[i][j][1], vertices[i][j][2], 0];
			temp.push(temp2);
			temp.push(temp2);
			temp.push(temp2);
		}
		flatNormals.push(temp);
	}

	// Set clear color
	gl.clearColor(0.5, 0.5, 0.5, 1.0);

	// gl.enable(gl.CULL_FACE);
	// gl.cullFace(gl.BACK);

	// do some trig to figure out eye z value
	const LtoR = Math.abs(extents_lrbtnf[1]) + Math.abs(extents_lrbtnf[0]); // length of left to right
	const BtoT = Math.abs(extents_lrbtnf[2]) + Math.abs(extents_lrbtnf[3]); // length of bottom to top

	const A = (LtoR/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2); // eye distance based on horizontal
	const B = (BtoT/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2); // eye distance based on vertical

	const eyeD = (A > B ? A : B); // get max

	objMiddle = vec3(0, 0, 0); // get middle of object

	initEye = vec3(0, 4, extents_lrbtnf[4] + eyeD * 9); // eye vector
	initAt = vec3(0, 0 - 4, 0); // at vector

	// PERSPECTIVE
	const asRatio = canvas.width / canvas.height;
	let thisProj = perspective(fovy, asRatio, extents_lrbtnf[4] / 10, initEye[2] * 20);

	// EYE
	const up = vec3(0.0, 1.0, 0.0);
	let viewMatrix = lookAt(initEye, initAt, up);

	// store PERSPECTIVE into gpu memory
	let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
	gl.uniformMatrix4fv(projMatrixLoc, false, flatten(thisProj));

	mvMatrix = viewMatrix; // initialize mvMatrix

	initTextures();

	// ~~~~~~~~ ENVIRONMENT MAP STUFF ~~~~~~~~~~~
	configureCubeMap();

	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposx.bmp", 0);
	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegx.bmp", 1);
	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposy.bmp", 2);
	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegy.bmp", 3);
	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposz.bmp", 4);
	configImage("http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegz.bmp", 5);

	setReflectOn(reflectionOn);
	setRefractOn(refractionOn);


	render();
}

let id;

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	if (rotOn) // increment rotation if on
		theta += 0.2;

	// handle the translation of the object
	const translSpeed = 0.01;
	if (transXOn_isRi[0]) { // if X translate on
		let sign = transXOn_isRi[1] === 1 ? 1 : -1; // determine direction
		trPar[0] += sign * translSpeed; // update translation vector
	}
	if (transYOn_isUp[0]) {
		let sign = transYOn_isUp[1] === 1 ? 1 : -1;
		trPar[1] += sign * translSpeed;
	}
	if (transZOn_isFr[0]) {
		let sign = transZOn_isFr[1] === 1 ? 1 : -1;
		trPar[2] += sign * translSpeed;
	}
	let translateMatrix = translate(trPar[0], trPar[1], trPar[2]); // translation matrix

	gl.uniform1f(gl.getUniformLocation(program,
		"dotP"), spotLAngle);

	mvMatrixLoc = gl.getUniformLocation(program, "mvMatrix");

	gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));

	let stack = new Stack();
	let linePoints = [];
	let point = vec4(0, 0, 0, 0);

	stack.push(mvMatrix, 0);
		mvMatrix = mult(mvMatrix, mult( mult(scalem(80, 80, 80), rotateY(45)), translate(1, -0.3, -1)));
		gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
		renderTex();

	mvMatrix = stack.pop();

	stack.push(mvMatrix, 0);
		mvMatrix = mult(mvMatrix, translateMatrix);


	if (indices.length >= 6) {

		stack.push(mvMatrix, 0);
		linePoints.push(point);
			mvMatrix = mult(mvMatrix, rotateY(theta));
			gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
			objectDrawInd(0);
		mvMatrix = stack.pop();

		stack.push(mvMatrix, 0);
		mvMatrix = mult(mvMatrix, rotateY(-theta));
			stack.push(mvMatrix, -theta);
				mvMatrix = mult(mvMatrix, mult(translate(6, -3, 0), rotateY(stack.calcRot(theta))));
				point = mult(mvMatrix, point);
				linePoints.push(point);
				gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
				objectDrawInd(1);

				stack.push(mvMatrix, 0);
					mvMatrix = mult(mvMatrix, mult(translate(2, -3, 0), rotateY(stack.calcRot(2*theta))));
					point = mult(mvMatrix, point);
					linePoints.push(point);
					gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
					objectDrawInd(1);
				mvMatrix = stack.pop();

				stack.push(mvMatrix, 0);
					mvMatrix = mult(mvMatrix, mult(translate(-2, -3, 0), rotateY(stack.calcRot(theta))));
					point = linePoints[linePoints.length-2];
					point = mult(mvMatrix, point);
					linePoints.push(point);
					gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
					objectDrawInd(2);
				mvMatrix = stack.pop();
			mvMatrix = stack.pop();

			stack.push(mvMatrix, -theta);
				mvMatrix = mult(mvMatrix, mult(translate(-6, -3, 0), rotateY(stack.calcRot(theta/3))));
				point = linePoints[linePoints.length-4];
				point = mult(mvMatrix, point);
				linePoints.push(point);

				gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
				objectDrawInd(3);

				stack.push(mvMatrix, 0);
					mvMatrix = mult(mvMatrix, mult(translate(2, -3, 0), rotateY(stack.calcRot(3*theta))));
					point = mult(mvMatrix, point);
					linePoints.push(point);
					gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
					objectDrawInd(4);
				mvMatrix = stack.pop();

				stack.push(mvMatrix, 0);
					mvMatrix = mult(mvMatrix, mult(translate(-2, -3, 0), rotateY(stack.calcRot(theta/2))));
					point = linePoints[linePoints.length-2];
					point = mult(mvMatrix, point);
					linePoints.push(point);
					gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvMatrix));
					objectDrawInd(5);
				mvMatrix = stack.pop();

			mvMatrix = stack.pop();
		mvMatrix = stack.pop();
	}

	mvMatrix = stack.pop();


	id = requestAnimationFrame(render);

}

function objectDrawInd(index) {
	const i = index;
	if (flatShadOn) {
		object(indices[i], vertices[i], matProp[i], flatNormals[i]);
	} else {
		object(indices[i], vertices[i], matProp[i], normals[i]);
	}
}

function object(indices, vertices, matProp, normals) {
	let texCoordsArray = [];
	for (let i = 0; i < indices.length; i++) {
		texCoordsArray.push(vec2(1,1)); // dummy textures
	}

	// INITIALIZE ATTRIBUTE BUFFERS

	let materialAmbient = matProp[0];
	let materialDiffuse = matProp[1];
	let materialSpecular = matProp[2];
	let materialShininess = matProp[3];

	let diffuseProduct = mult(lightDiffuse, materialDiffuse);
	let specularProduct = mult(lightSpecular, materialSpecular);
	let ambientProduct = mult(lightAmbient, materialAmbient);


	gl.uniform4fv(gl.getUniformLocation(program,
		"diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program,
		"specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program,
		"ambientProduct"), flatten(ambientProduct));
	gl.uniform1f(gl.getUniformLocation(program,
		"shininess"), materialShininess);

	// VERTICES
	// Create an empty buffer object to store vertex buffer
	vertex_buffer = gl.createBuffer();
	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	// Unbind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	// INDICES
	// Create an empty buffer object to store Index buffer
	let index_Buffer = gl.createBuffer();
	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	// Unbind the buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


	// Bind vertex buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	// Bind index buffer object
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_Buffer);

	//Get the location of the shader's vPosition attribute in the GPU's memory
	let vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// TEXTURES
	let tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

	let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord );


	// NORMALS
	let vBuffer2 = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	let vNormal = gl.getAttribLocation( program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	setHasTex(0.0);

	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);

	if (shadowsOn) {

		// ~~~~~~~~~~ SHADOWS ~~~~~~~~~~~

		setIsShadow(1.0);

		let m = mat4();
		m[3][3] = 0;
		m[3][2] = -1 / lightPosition[2]; // shadow size is proportional to light proximity

		let modelViewMatrix = mult(mvMatrix, translate(lightPosition[0], lightPosition[1], lightPosition[2]));
		modelViewMatrix = mult(modelViewMatrix, m);
		modelViewMatrix = mult(modelViewMatrix, translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]));
		// modelViewMatrix = mult(modelViewMatrix, translate(0, 0, -3));

		gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(modelViewMatrix));
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		setIsShadow(0.0);
	}
}

function setIsShadow(num) {
	gl.uniform1f(gl.getUniformLocation(program,
		"isShadow"), num);
}

function sinDeg(angleDegrees) {
	return Math.sin(angleDegrees*Math.PI/180);
}

function flip(int) {
	return int === 0 ? 1 : 0;
}

// handles keypresses
function handleKeys() {
	window.onkeydown = function(event)
	{
		let key = event.key;
		switch (key) {
			case "b": {
				texOn = flip(texOn);
				break;
			}
			case "a": {
				shadowsOn = flip(shadowsOn);
				break;
			}
			case "c": {
				reflectionOn = flip(reflectionOn);
				setReflectOn(reflectionOn);
				break;
			}
			case "d": {
				refractionOn = flip(refractionOn);
				setRefractOn(refractionOn);
				break;
			}
			case "m": {
				flatShadOn = 0;
				break;
			}
			case "n": {
				flatShadOn = 1;
				break;
			}
			case "p": {
				spotLAngle += spotLAngInc;
				break;
			}
			case "i": {
				spotLAngle -= spotLAngInc;
				break;
			}
			case "ArrowRight": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transXOn_isRi = [1, 1];
				}
				break;
			}
			case "ArrowLeft": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transXOn_isRi = [1, 0];
				}
				break;
			}
			case "ArrowUp": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transYOn_isUp = [1, 1];
				}
				break;
			}
			case "ArrowDown": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transYOn_isUp = [1, 0];
				}
				break;
			}
			case "q": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transZOn_isFr = [1, 1];
				}
				break;
			}
			case "e": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transZOn_isFr = [1, 0];
				}
				break;
			}
			case "r": {
				rotOn = flip(rotOn);
				break;
			}
		}
	};
}
