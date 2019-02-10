
let gl;
let program;

let colors;
let theta = 0;
let alpha = 0;
let away = 0;

let  fovy = 30.0;
let initEye;
let initAt;

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

	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.enable(gl.DEPTH_TEST);

	colors = [];
	for (let i = 0; i < vertices.length; i++) {
		colors.push(vec4(1.0,1.0,1.0,1.0));
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

	const LtoR = Math.abs(extents_lrbtnf[1]) + Math.abs(extents_lrbtnf[0]); // length of left to right
	const BtoT = Math.abs(extents_lrbtnf[2]) + Math.abs(extents_lrbtnf[3]); // length of bottom to top

	const A = (LtoR/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2);
	const B = (BtoT/2*sinDeg(90-fovy/2)) / sinDeg(fovy/2);

	const eyeD = (A > B ? A : B);

	const xMid = (extents_lrbtnf[1] + extents_lrbtnf[0]) / 2;
	const yMid = (extents_lrbtnf[3] + extents_lrbtnf[2]) / 2;
	const zMid = (extents_lrbtnf[4] + extents_lrbtnf[5]) / 2;

	initEye = vec3(xMid, yMid, extents_lrbtnf[4] + eyeD * 1.13);

	initAt = vec3(xMid, yMid, zMid);

	render();

}

function drawAll() {

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (let i = 0; i < indices.length; i++) {
		triangle(indices[i]);
	}
}

function triangle(indices) {


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

	//Specify the vertex size
	let offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 2.0);

	// PERSPECTIVE
	let asRatio = canvas.width / canvas.height;
	let thisProj = perspective(fovy, asRatio, extents_lrbtnf[4] / 2, initEye[2] * 2);

	let projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// gl.drawArrays(gl.LINE_LOOP, 0, vertices.length);
	gl.drawElements(gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT,0);
}

let id;

function render() {
	let rotMatrix = rotate(theta, vec3(-1, -1, 0));
	//var rotMatrix = rotateY(theta);
	//var rotMatrix2 = rotateX(45);
	let translateMatrix = translate(alpha, 0, 0);
	//var tempMatrix = mult(rotMatrix, rotMatrix2);
	//var ctMatrix = mult(translateMatrix, tempMatrix);
	let ctMatrix = mult(translateMatrix, rotMatrix);

	console.log(extents_lrbtnf);

	// theta += 0.5;
	// alpha += 0.3;
	// away += 0.01 * eyeD;

	let eye = initEye;
	let at = initAt;

	console.log(eye);

	const up = vec3(0.0, 1.0, 0.0);
	let viewMatrix = lookAt(eye, at, up);

	let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	let viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

	drawAll();


	//if(theta < -90) {
	//	cancelAnimationFrame(id);
	//}
	//else
	//{
	// 	id = requestAnimationFrame(render);
	//}

}

function sinDeg(angleDegrees) {
	return Math.sin(angleDegrees*Math.PI/180);
}

function getEyeZ(midX, midY) {
	const maxZ = extents_lrbtnf[5];
	const maxX = extents_lrbtnf[1];
	const maxY = extents_lrbtnf[3];

	// possible distance that for sure sees the Y aspect of the box
	const A = ((maxY - midY) / Math.tan(fovy / 2)) +
		( maxZ * 3);
	// possible distance that for sure sees the X aspect of the box
	const B = ((maxX - midX) / Math.tan(fovy / 2)) +
		( maxZ * 3);
	return (A > B ? A : B);
}