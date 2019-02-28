Structure and implementation notes:

The program starts by initializing the canvas and the webgl elements. By default, a blank canvas is displayed. The rendering starts when the user selects the ply files to be used. The setup() function initializes the basic webgl elements, namely the canvas and the shaders. The main() function, which gets called immediately after a new file has been parsed, calculates all the constant elements such as the view and projection matrices. It then calls the render function, which is the callback for an animation frame, and handles the model calculations and the drawing of files. Note that instead of representing each shape as a list of vertices, it is a list of indices to vertices. The use of ELEMENT_ARRAY_BUFFER ensures that webgl translates the indices into vertices. This implementation intends to maximize efficiency.

Apart from the libraries, the program is comprised of 3 code files.

1) File index.html contains all the html code and defines the various html elements.
2) File webgl.js contains the webgl code, the main(), setup() and render() functions as described above. It also contains the handler for keyboard events.
3) File file.js contains the implementation of opening and parsing the .ply files.

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
    3) w: translate model up
    4) s: translate model down
    5) a: translate model left
    6) d: translate model right
    7) q,e: translate model positive/negative z
    8) r: freezes the rotation of the model

