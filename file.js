let debug_p = 0;
let extents_lrbtnf;
let vertices = [];
let indices = [];

function print(text) {
    if (debug_p)
        console.log(text);
}

function update_ext(extents, x, y, z) {
    if (extents.length < 6) {
        extents = [x, x, y, y, z, z];
    } else {
        if (x < extents[0]) // x smaller than leftmost
            extents[0] = x;
        if (x > extents[1]) // x bigger than rightmost
            extents[1] = x;
        if (y < extents[2]) // y less than bottom
            extents[2] = y;
        if (y > extents[3]) // y more than top
            extents[3] = y;
        if (z > extents[4]) // z more than near
            extents[4] = z;
        if (z < extents[5]) // z less than far
            extents[5] = z;
    }
    return extents;
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
            for (let i = 0; i < x.files.length; i++) {
                parseFile(x.files[i]);
            }
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
        let extents = [];
        let new_vertices = [];
        for (let i = 0; i < n_vertices; i++) {
            let co = strArrtoF(data.shift().split(/\s+/)); // extract data, turn to int array
            extents = update_ext(extents, co[0], co[1], co[2]);
            new_vertices.push([co[0], co[1], co[2], 1.0]); // push to global vertices
            //update_ext(co[0], co[1], co[2]);
        }
        let midX = (extents[1] + extents[0]) / 2;
        let midY = (extents[3] + extents[2]) / 2;
        let midZ = (extents[5] + extents[4]) / 2;

        // normalize
        let sum = 0;
        const xyz = [extents[0] - extents[1], extents[2] - extents[3], extents[4] - extents[5]];
        for (let aa = 0; aa < xyz.length; aa++) {
            sum += xyz[aa] * xyz[aa];
        }
        let ratio = Math.sqrt(sum);
        ratio /= 3;

        // apply normalization
        for (let i = 0; i < new_vertices.length; i++) {
            new_vertices[i] = [new_vertices[i][0] - midX,
                new_vertices[i][1] - midY, new_vertices[i][2] - midZ, 1.0]; // translate to (0, 0, 0)
            for (let aa = 0; aa < new_vertices[i].length-1; aa++) {
                new_vertices[i][aa] /= ratio; // scale
            }
        }

        // push
        vertices.push(new_vertices);

        // extract all polygons
        let new_indices = [];
        for (let i = 0; i < n_polygons; i++) {
            let coords = strArrtoF(data.shift().split(/\s+/)); // extract data, turn to int array
            coords.shift();
            new_indices.push.apply(new_indices, coords); // push to global vertices
        }
        indices.push(new_indices);

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