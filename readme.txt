Structure and implementation notes:

The program starts by initializing the canvas and the webgl elements. By default, a blank canvas is displayed. The rendering starts when the user selects a file. The setup() function initializes the basic webgl elements, namely the canvas and the shaders. The main() function, which gets called imediately after a new file has been parsed, calculates all the constant elements such as the view and projection matrices. It then calls the render function, which is the callback for an animation frame, and handles the model calculations and the drawing of files. Note that instead of representing each shape as a list of vertices, it is a list of indices to vertices. The use of ELEMENT_ARRAY_BUFFER ensures that webgl translates the indices into vertices. This implementation intends to maximize efficiency.

Apart from the libraries, the program is comprised of 3 code files.

1) File index.html contains all the html code and defines the various html elements.
2) File webgl.js contains the webgl code, the main(), setup() and render() functions as described above. It also contains the handler for keyboard events.
3) File file.js contains the implementation of opening and parsing the .ply files.