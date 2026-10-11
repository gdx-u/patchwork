let puzzle;

let $ = e => document.getElementById(e);

async function load_puzzle(url) {
    let file = await fetch(url);
    let text = await file.text();
    puzzle = JSON.parse(text);
    if (puzzle.rows !== puzzle.cols) console.log("rectangular grids are currently unsupported :(");

    $("title").innerText = puzzle.title;
}

function create_grid() {
    let grid_el = $("grid");
    let bcr = grid_el.getBoundingClientRect();
    if (bcr.width !== bcr.height) console.log("rectangular grid???");
    
    let size = bcr.width;
    let tile_size = Math.floor(size / puzzle.rows);

    function create_square(x, y, cell_label, patch_id) {
        let el = document.createElement("div");
        el.className = "square";
        el.style.width = `${tile_size}px`;
        el.style.height = `${tile_size}px`;
        el.style.top = `${y * tile_size}px`;
        el.style.left = `${x * tile_size + 16}px`;
        if (x == 0) {
            el.style.borderLeft = "1px solid #222";
            let label = document.createElement("div");
            label.className = "label";
            label.innerText = "ABCDEFGHIJKLMNO"[y];
            el.appendChild(label); 
        }
        if (y == 0) el.style.borderTop = "1px solid #222";
        el.id = `${x};${y}`;
        el.classList.add(`patch-${patch_id}`);

        if (cell_label) {
            let label = document.createElement("div");
            label.className = "label";
            label.innerText = cell_label;
            label.style.textAlign = "right";
            el.appendChild(label); 
        }
        grid_el.appendChild(el);
    }

    for (let patch of puzzle.patches) {
        let TL = patch.cells[0];
        create_square(TL[1], TL[0], patch.label, patch.label);
        
        for (let cell of patch.cells.slice(1)) {
            create_square(cell[1], cell[0], null, patch.label);
        }
    }
}

function get_id(cell) {
    return parseInt(cell.className.split(" ").filter(e => e.startsWith("patch-"))[0].slice(6));
}

function draw_patches() {
    const directions = {
        "Top": [0, -1],
        "Left": [-1, 0],
        "Right": [1, 0],
        "Bottom": [0, 1]
    };

    for (let cell of document.querySelectorAll(".square")) {
        let [x, y] = cell.id.split(";").map(Number);
        let id = get_id(cell);
        for (let [direction, offset] of Object.entries(directions)) {
            let nx = x + offset[0];
            let ny = y + offset[1];
            if (nx < 0 || nx == puzzle.cols || ny < 0 || ny == puzzle.rows) {
                cell.style[`border${direction}`] = "3px solid #111";
                continue;
            }

            let neighbour = $(`${nx};${ny}`);
            let nid = get_id(neighbour);
            if (nid !== id) {
                cell.style[`border${direction}`] = "3px solid #111";
            }
        }
    }
}

function load_clues() {

    function create_clue(type, label, clue) {
        let parent = $(type);
        let el = document.createElement("div");
        el.className = "clue";
        let iden = document.createElement("div");
        iden.className = "iden";
        iden.innerText = `${label}:`
        let text = document.createElement("div");
        text.className = "text";
        text.innerText = clue;
        el.appendChild(iden);
        el.appendChild(text);
        parent.appendChild(el);
    }

    // across clues
    for (let clue of puzzle.horizontals) {
        create_clue("spanner", clue.label, clue.clue);
    }

    for (let patch of puzzle.patches) {
        create_clue("patch", patch.label, patch.clue);
    }
}

async function main() {
    await load_puzzle("puzzle.json");
    create_grid();
    draw_patches();

    load_clues();
    attach_handlers(); // from interact.js
}

main();