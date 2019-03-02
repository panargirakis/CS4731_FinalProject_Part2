Structure and implementation notes:

The program starts by initializing the canvas and the webgl elements. By default, a blank canvas is displayed. The rendering starts when the user selects the ply files to be used. The setup() function initializes the basic webgl elements, namely the canvas and the shaders. The main() function, which gets called immediately after a new file has been parsed, calculates and initializes all the constant elements such as the view and projection matrices, the normals and the textures. It then calls the render function. The render function is the callback for an animation frame, and handles the model calculations and the drawing of objects, textures and shadows. Note that instead of representing each shape as a list of vertices, it is a list of indices to vertices. The use of ELEMENT_ARRAY_BUFFER ensures that webgl translates the indices into vertices. This implementation intends to maximize efficiency. The spotlight is roughly located in the top right corner of the scene regarding x,y and far back in the negative z direction (lightPosition = vec4(8.0, 5.0, -20.0, 0.0)).

Apart from the libraries, the program is comprised of 5 code files.

1) File index.html contains all the html code and defines the various html elements and the shaders.
2) File webgl.js contains the webgl code, the main(), setup() and render() functions as described above. It also contains the handler for keyboard events.
3) File file.js contains the implementation of opening and parsing the .ply files.
4) File environment.js contains all the code that defines, initializes and renders the environment map.
5) File textures.js contains all the code that defines, initializes and renders the textures.

~~~~~~~~~~USAGE~~~~~~~~~:

The program uses PLY files to work. There are 3 options:
    1) Select ONLY 1 PLY file (it will be used for all the shapes)
    2) Select ONLY 2 PLE files (for example, a sphere and a cube) that will be used interchangeably
    3) Select 6+ files. In this case, the first 6 files will be used as models.

IF 3,4 OR 5 SHAPES ARE SELECTED, THE ANIMATION WILL NOT START

After the files have been selected, the animation will run.

Controls available to the user:
    1) i: decrease spotlight angle
    2) p: increase spotlight angle
    8) r: toggles the rotation of the model
    9) a: toggle shadows
    10) b: toggle image textures
    11) c: toggle reflection
    12) d: toggle refraction

By default, textures are on, reflection is off, refraction is off and shadows are off.

Extra Credit:

The following controls were added:
    1) t: translate model up
    2) g: translate model down
    3) f: translate model left
    4) h: translate model right
    5) q,e: translate model positive/negative z
    6) ArrowUp: translate wall up
    7) ArrowDown: translate wall down
    8) ArrowLeft: translate wall left
    9) ArrowRight: translate wall right
