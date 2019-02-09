
let gl;
let program;

let points;
let colors;
let theta = 0;
let alpha = 0;

let canvas;

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
	//Set up the viewport
	let d_width = extents_lrbtnf[1] - extents_lrbtnf[0]; // delta width
	let d_height = extents_lrbtnf[3] - extents_lrbtnf[2]; // delta height
	let ratio = d_height / d_width; // aspect ratio
	if (ratio > 1.0) { // handdle aspect ratio
		gl.viewport( 0, 0, canvas.width / ratio, canvas.height);
	} else {
		gl.viewport(0, 0, canvas.width, canvas.height * ratio);
	}

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.DEPTH_TEST);


	for (let i = 0; i < shapes.length; i++) {
		triangle(shapes[i]);
	}

}

function triangle(points) {
	colors = [];
	for (let i = 0; i < points.length; i++) {
		colors.push(vec4(1.0,1.0,1.0,1.0));
	}


	//Create the buffer object
	let vBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	//Get the location of the shader's vPosition attribute in the GPU's memory
	let vPosition = gl.getAttribLocation(program, "vPosition");


	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	//Specify the vertex size
	let offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 2.0);

	let cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	let vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	//This is how we handle extents
	let thisProj = ortho(extents_lrbtnf[0], extents_lrbtnf[1], extents_lrbtnf[2],
		extents_lrbtnf[3], extents_lrbtnf[4], extents_lrbtnf[5]);

	let projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	//Necessary for animation
	render();

	// gl.drawArrays(gl.LINE_LOOP, 0, points.length);
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

	theta += 0.5;
	//alpha += 0.005;

	let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.LINE_LOOP, 0, points.length);
	// gl.drawArrays(gl.LINE_STRIP, 0, points.length);

	//console.log(theta);

	//if(theta < -90) {
	//	cancelAnimationFrame(id);
	//}
	//else
	//{
		id = requestAnimationFrame(render);
	//}

}

//
function quad(a, b, c, d)
{
	let vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

	let vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

	let indices = [ a, b, c, a, c, d ];

    for (let i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);

    }
}