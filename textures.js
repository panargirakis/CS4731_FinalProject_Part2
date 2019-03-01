let wallPoints = [];
let walltexCoords = [];

let floorPoints = [];
let floortexCoords = [];

let texture = [];
let texToUse = [];
let plainTex = [];

let minT = 0.0;
let maxT = 2.5;

let texOn;

//Texture coordinates at the corners of a quadrilateral
//Right side up

let texCoord = [
    vec2(minT, minT),
    vec2(minT, maxT),
    vec2(maxT, maxT),
    vec2(maxT, minT)
];

// vertices for creating walls
let quadVert = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// create a plain texture
function plainTexture(ind) {
    let color = [0, 0, 255, 255];
    if (ind === 0) {
        color = [128, 128, 128, 255];
    }

    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(color));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return tex;
}

// load images into texture units
function loadTexture(url) {
    let tex = plainTexture();

    const image = new Image();
    image.src = url;
    image.crossOrigin = "";
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    };

    return tex;
}

// switch between textures
function activateTex(ind) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texToUse[ind]);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

// is used to crete walls
function quad(a, b, c, d) {
    let points = [];
    let texPoints = [];

    points.push(quadVert[a]);
    texPoints.push(texCoord[0]);

    points.push(quadVert[b]);
    texPoints.push(texCoord[1]);

    points.push(quadVert[c]);
    texPoints.push(texCoord[2]);

    points.push(quadVert[a]);
    texPoints.push(texCoord[0]);

    points.push(quadVert[c]);
    texPoints.push(texCoord[2]);

    points.push(quadVert[d]);
    texPoints.push(texCoord[3]);

    return [points, texPoints];
}

// create walls array
function wall()
{
    let temp = quad( 2, 3, 7, 6 );
    wallPoints = wallPoints.concat(temp[0]);
    walltexCoords = walltexCoords.concat(temp[1]);
    temp = quad( 5, 4, 7, 6 );;
    wallPoints= wallPoints.concat(temp[0]);
    walltexCoords = walltexCoords.concat(temp[1]);
}

// create floor array
function floor() {
    let temp = quad( 0, 3, 7, 4 );
    floorPoints = temp[0];
    floortexCoords = temp[1];
}

// render textures
function renderTex() {
    if (texOn) { // decide if plain or textured
        texToUse = texture;
    } else {
        texToUse = plainTex;
    }

    setHasTex(1.0); // set flag

    activateTex(1); // set which texture is used
    bufferWall(floorPoints, floortexCoords); // buffer texture
    gl.drawArrays( gl.TRIANGLES, 0, floorPoints.length);

    activateTex(0);
    bufferWall(wallPoints, walltexCoords);
    gl.drawArrays( gl.TRIANGLES, 0, wallPoints.length);
}

// set shader flag
function setHasTex(num) {
    gl.uniform1f(gl.getUniformLocation(program,
        "hasTex"), num);
}

// initialize the textures
function initTextures() {
    wall();
    floor();

    let url = "http://web.cs.wpi.edu/~jmcuneo/stones.bmp";
    texture.push(loadTexture(url));
    plainTex.push(plainTexture(1));

    url = "http://web.cs.wpi.edu/~jmcuneo/grass.bmp";
    texture.push(loadTexture(url));
    plainTex.push(plainTexture(0));
}

// store a wall (or floor) into vertex buffer
function bufferWall(points, texCoords) {
    bufferDummyNormals(points);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    let vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    let tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

    let vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
}

// buffer dummy normals into shader attribute
function bufferDummyNormals(points) {
    let normals = [];
    for (let i = 0; i < points.length; i++) {
        normals.push(vec4(1,1,1,1));
    }

    // NORMALS
    let vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    let vNormal = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

}