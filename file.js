let debug_p = 0;
let extents_lrbtnf = [];
let vertices = [];
let indices = [];

function print(text) {
    if (debug_p)
        console.log(text);
}

function update_ext(x, y, z) {
    if (extents_lrbtnf.length < 6) {
        extents_lrbtnf = [x, x, y, y, z, z];
    } else {
        if (x < extents_lrbtnf[0]) // x smaller than leftmost
            extents_lrbtnf[0] = x;
        if (x > extents_lrbtnf[1]) // x bigger than rightmost
            extents_lrbtnf[1] = x;
        if (y < extents_lrbtnf[2]) // y less than bottom
            extents_lrbtnf[2] = y;
        if (y > extents_lrbtnf[3]) // y more than top
            extents_lrbtnf[3] = y;
        if (z > extents_lrbtnf[4]) // z more than near
            extents_lrbtnf[4] = z;
        if (z < extents_lrbtnf[5]) // z less than far
            extents_lrbtnf[5] = z;
    }
}

function readFile() {

    let x = document.getElementById("myFile");
    let txt = "";
    if ('files' in x) {
        if (x.files.length === 0) {
            txt = "Select a file.";
        } else {
            txt += "<br><strong>" + "File info:</strong><br>";
            let file = x.files[0];
            if ('name' in file) {
                txt += "name: " + file.name + "<br>";
            }
            if ('size' in file) {
                txt += "size: " + file.size + " bytes <br>";
            }

            parseFile(file);
        }
    }
    else {
        if (x.value === "") {
            txt += "Select a file.";
        } else {
            txt += "The files property is not supported by your browser!";
            txt  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead.
        }
    }
    document.getElementById("label1").innerHTML = txt;
}

function parseFile(file) {
    let reader = new FileReader();

    reader.onload = function(){
        let data = reader.result;
        extents_lrbtnf = [];

        data = data.split(/\s*\r?\n\s*/); //split lines
        if (data[0].search(/ply/) === -1)
            console.log("Error. 'ply' not found in file");
        data.shift();

        let n_vertices = 0;
        let n_polygons = 0;
        while (data.length > 0) {
            let line = data.shift();
            if (line.search(/format\sascii/) > -1) {
                print("format ascii");
            }
            else if (line.search(/property\sfloat/) > -1) {
                print("property float");
            }
            else if (line.search(/property\slist\suint8/) > -1) {
                print("property list uint8");
            }
            else if (line.search(/end_header/) > -1) {
                print("end header");
                break;
            }
            else if (line.search(/element\svertex/) > -1) {
                print("element vertex");
                let ind = line.search(/\d/);
                n_vertices = parseInt(line.slice(ind, line.length));
            }
            else if (line.search(/element\sface/) > -1) {
                print("element face");
                let ind = line.search(/\d/);
                n_polygons = parseInt(line.slice(ind, line.length));
            }
        }

        print(n_vertices);
        print(n_polygons);

        // extract all vertices
        vertices = [];
        for (let i = 0; i < n_vertices; i++) {
            let co = strArrtoF(data.shift().split(/\s+/)); // extract data, turn to int array
            vertices.push([co[0], co[1], co[2], 1.0]); // push to global vertices
            update_ext(co[0], co[1], co[2]);
        }

        // extract all polygons
        indices = [];
        for (let i = 0; i < n_polygons; i++) {
            let coords = strArrtoF(data.shift().split(/\s+/)); // extract data, turn to int array
            coords.shift();
            indices.push(coords); // push to global vertices
        }

        print(vertices);
        print(indices);


        main();

    };

    reader.readAsText(file);
}

// returns float array from string array
function strArrtoF(stringArray) {
    let result = [];
    for (let i = 0, item; item = stringArray[i]; i++) {
        result.push(parseFloat(item));
    }
    return result;
}