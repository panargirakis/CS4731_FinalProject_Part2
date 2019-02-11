
let gl;
let program;

let normals;

let colors;
let theta = 0;
let breathe = 0;
let isIncr = 1;
let trPar = [0, 0, 0];

const fovy = 30.0;
let initEye;
let initAt;
let objMiddle;
let objScale;

let pulseOn = 0, transXOn_isRi = [0, 0], transYOn_isUp = [0, 0], transZOn_isFr = [0, 0], rotOn = 0;

	let canvas;

let vertex_buffer;

function setup() {
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

}


function main() 
{
	handleKeys();
	pulseOn = 0, transXOn_isRi = [0, 0], transYOn_isUp = [0, 0], transZOn_isFr = [0, 0], rotOn = 0;
	theta = 0;
	breathe = 0;
	isIncr = 1;
	trPar = [0, 0, 0];

	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.enable(gl.DEPTH_TEST);

	colors = [];
	for (let i = 0; i < vertices.length; i++) {
		colors.push(vec4(1.0,1.0,1.0,1.0));
	}

	normals = [];
	for (let i = 0; i < indices.length; i++) {
		let temp = indices[i];

		let norm = [0, 0, 0];

		for (let j = 0; j < temp.length; j++) {
			let vert_curr = vertices[temp[j]];
			let vert_next = vertices[temp[(j+1)%temp.length]];

			norm[0] += (vert_curr[1] - vert_next[1]) * (vert_curr[2] + vert_next[2]);
			norm[1] += (vert_curr[2] - vert_next[2]) * (vert_curr[0] + vert_next[0]);
			norm[2] += (vert_curr[0] - vert_next[0]) * (vert_curr[1] + vert_next[1]);
		}

		let sum = 0;
		for (let aa = 0; aa < norm.length; aa++) {
			sum += norm[aa]*norm[aa];
		}
		let ratio = Math.sqrt(sum);
		for (let aa = 0; aa < norm.length; aa++) {
			norm[aa] /= ratio;
		}

		normals.push(norm);
	}


	// VERTICES
	// Create an empty buffer object to store vertex buffer
	vertex_buffer = gl.createBuffer();
	// Bind appropriate array buffer to it
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	// Pass the vertex data to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	// Unbind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	// COLOR
	let cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	let vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// do some trig to figure out eye z value
	const LtoR = Math.abs(extents_lrbtnf[1]) + Math.abs(extents_lrbtnf[0]); // length of left to right
	const BtoT = Math.abs(extents_lrbtnf[2]) + Math.abs(extents_lrbtnf[3]); // length of bottom to top

	const A = (LtoR/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2); // eye distance based on horizontal
	const B = (BtoT/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2); // eye distance based on vertical

	const eyeD = (A > B ? A : B); // get max

	const xMid = (extents_lrbtnf[1] + extents_lrbtnf[0]) / 2;
	const yMid = (extents_lrbtnf[3] + extents_lrbtnf[2]) / 2;
	const zMid = (extents_lrbtnf[4] + extents_lrbtnf[5]) / 2;
	objMiddle = vec3(xMid, yMid, zMid); // get middle of object

	initEye = vec3(xMid, yMid, extents_lrbtnf[4] + eyeD * 1.2); // eye vector
	initAt = vec3(xMid, yMid, zMid); // at vector

	// PERSPECTIVE
	const asRatio = canvas.width / canvas.height;
	let thisProj = perspective(fovy, asRatio, extents_lrbtnf[4] / 10, initEye[2] * 20);

	// EYE
	const up = vec3(0.0, 1.0, 0.0);
	let viewMatrix = lookAt(initEye, initAt, up);

	// combine PERSPECTIVE and VIEW and store them in GPU memory
	let pvM = mult(thisProj, viewMatrix);
	let projViewMatrixLoc = gl.getUniformLocation(program, "projViewMatrix");
	gl.uniformMatrix4fv(projViewMatrixLoc, false, flatten(pvM));

	// get an idea of the coordinate scaling the object uses
	const zScale = Math.abs(extents_lrbtnf[4] - extents_lrbtnf[5]);
	const xScale = Math.abs(extents_lrbtnf[0] - extents_lrbtnf[1]);
	const yScale = Math.abs(extents_lrbtnf[2] - extents_lrbtnf[3]);
	objScale = Math.max(xScale, yScale, zScale);

	render();
}

let id;

function render() {
	if (rotOn) // increment rotation if on
		theta += 0.5;
	// translate * rotate * translate ensures object is rotated about its own center
	let trans1 = translate(-objMiddle[0], -objMiddle[1], -objMiddle[2]);
	let rotMatrix = rotate(theta, vec3(1, 0, 0));
	let trans2 = translate(objMiddle[0], objMiddle[1], objMiddle[2]);

	// handle the translation of the object
	const translSpeed = 0.01 * objScale;
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

	let ctMatrix = mult(translateMatrix, mult(trans2, mult(rotMatrix, trans1)));


	// handle the pulsing effect - modulates 'breathe' var from 0 to 1
	const duration = 2.0; // target duration of animation in seconds
	if (pulseOn) {
		// increment based on direction
		const sign = isIncr === 1 ? 1 : -1;
		breathe += sign * ( 1 / 60 / duration);

		// clip to bounds
		if (breathe < 0)
			breathe = 0;
		if (breathe > 1)
			breathe = 1;

		if (breathe === 1.0 && isIncr === 1) {
			isIncr = 0;
		} else if (breathe === 0.0 && isIncr === 0) {
			isIncr = 1;
		}
	}

	// place final matrix in gpu buffer
	let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	drawAll();


	id = requestAnimationFrame(render);

}

function drawAll() {

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (let i = 0; i < indices.length; i++) {
		triangle(indices[i], normals[i]);
	}
}

function triangle(indices, normal) {


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


	// create translate matrix for pulsing effect
	const scl = breathe * 0.1 * objScale;
	let translateMatrix = translate(normal[0] * scl, normal[1] * scl, normal[2] * scl);

	// save matrix
	let ctmLoc = gl.getUniformLocation(program, "currTM");
	gl.uniformMatrix4fv(ctmLoc, false, flatten(translateMatrix));

	//Get the location of the shader's vPosition attribute in the GPU's memory
	let vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawElements(gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT,0);
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
			case "x": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transXOn_isRi = [1, 1];
				}
				break;
			}
			case "c": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transXOn_isRi = [1, 0];
				}
				break;
			}
			case "y": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transYOn_isUp = [1, 1];
				}
				break;
			}
			case "u": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transYOn_isUp = [1, 0];
				}
				break;
			}
			case "z": {
				if (transXOn_isRi[0] || transYOn_isUp[0] || transZOn_isFr[0]) {
					transXOn_isRi[0] = 0; transYOn_isUp[0] = 0; transZOn_isFr[0] = 0;
				} else {
					transZOn_isFr = [1, 1];
				}
				break;
			}
			case "a": {
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
			case "b": {
				pulseOn = flip(pulseOn);
				break;
			}
		}
	};
}
