let dir = "horizontal";
let selected = null;
let clear_highlights = () => { [...document.querySelectorAll(".highlighted")].forEach(e => e.classList.remove("highlighted")); }
let clear_selected_clue = () => { [...document.querySelectorAll(".selected-clue")].forEach(e => e.classList.remove("selected-clue")); }

let squares = () => [...document.querySelectorAll(".square")];
let col_of = cell => parseInt(cell.id.split(";")[0]);
let row_of = cell => parseInt(cell.id.split(";")[1]);
let reading_order = cells => [...cells].sort((a, b) => row_of(a) - row_of(b) || col_of(a) - col_of(b));

let letter_el = cell => cell.querySelector(".letter") ?? cell.appendChild(Object.assign(document.createElement("span"), { className: "letter" }));
let get_letter = cell => cell.querySelector(".letter")?.textContent ?? "";
let set_letter = (cell, char) => { letter_el(cell).textContent = char; }

function highlight_horizontal(letter) {
    clear_highlights();
    for (let cell of [...document.querySelectorAll(".square")].filter(e => "ABCDEFGHIJKLMNO"[parseInt(e.id.split(";")[1])] == letter)) { cell.classList.add("highlighted"); }
}

function highlight_patch(num) {
    clear_highlights();
    for (let cell of puzzle.patches.filter(e => e.label == num)[0].cells) {
        $(`${cell[1]};${cell[0]}`).classList.add("highlighted");
    }
}

function cells_of_row(row) {
    return squares().filter(e => row_of(e) == row).sort((a, b) => col_of(a) - col_of(b));
}

function patch_of(cell) {
    return puzzle.patches.find(p => p.cells.some(c => c[0] == row_of(cell) && c[1] == col_of(cell)));
}

function cells_of_patch(patch) {
    return [...patch.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(c => $(`${c[1]};${c[0]}`));
}

function active_cells() {
    let patch = dir == "patch" ? patch_of(selected) : null;
    return patch ? cells_of_patch(patch) : cells_of_row(row_of(selected));
}

function active_clue_element() {
    if (dir == "patch") {
        let patch = patch_of(selected);
        return [...document.querySelectorAll("#patch .clue")].find(c => parseInt(c.firstElementChild.innerText) == parseInt(patch.label));
    }
    let letter = String.fromCharCode(65 + row_of(selected));
    return [...document.querySelectorAll("#spanner .clue")].find(c => c.firstElementChild.innerText.trim()[0] == letter);
}

function clue_text_of(clue) {
    return [...clue.childNodes].filter(n => n != clue.firstElementChild).map(n => n.textContent).join("").trim();
}

function scroll_in_list(clue) {
    let box = clue.parentElement;
    while (box && box != document.body && box.scrollHeight <= box.clientHeight) box = box.parentElement;
    if (!box || box == document.body) return;
    let c = clue.getBoundingClientRect();
    let b = box.getBoundingClientRect();
    if (c.top < b.top) box.scrollTop -= b.top - c.top;
    else if (c.bottom > b.bottom) box.scrollTop += c.bottom - b.bottom;
}

function show_active_clue() {
    [...document.querySelectorAll(".active-clue")].forEach(e => e.classList.remove("active-clue"));
    let clue = active_clue_element();
    let box = $("clue-text");
    if (clue) clue.classList.add("active-clue");
    if (clue) scroll_in_list(clue);
    if (box) box.innerText = clue ? clue_text_of(clue) : "";
}

function select(cell, new_dir = dir) {
    if (new_dir == "patch" && !patch_of(cell)) new_dir = "horizontal";
    dir = new_dir;
    selected?.classList.remove("selected");
    clear_selected_clue();
    selected = cell;
    selected.classList.add("selected");
    active_cells().filter(e => e != selected).forEach(e => e.classList.add("selected-clue"));
    show_active_clue();
}

function toggle_dir() {
    select(selected, dir == "horizontal" ? "patch" : "horizontal");
}

function step_clue(delta) {
    let clues = dir == "patch"
        ? puzzle.patches.map(cells_of_patch)
        : [...Array(Math.max(...squares().map(row_of)) + 1).keys()].map(cells_of_row);
    if (clues.length == 0) return;
    let current = clues.findIndex(cells => cells.includes(selected));
    let next = clues[(current + delta + clues.length) % clues.length];
    select(next.find(e => !get_letter(e)) ?? next[0]);
}

function type_letter(char) {
    set_letter(selected, char);
    let cells = active_cells();
    let next = cells[cells.indexOf(selected) + 1];
    if (next) select(next);
}

function backspace() {
    if (get_letter(selected)) { set_letter(selected, ""); return; }
    let cells = active_cells();
    let prev = cells[cells.indexOf(selected) - 1];
    if (prev) { set_letter(prev, ""); select(prev); }
}

let moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

function attach_handlers() {
    for (let clue of document.querySelectorAll(".clue")) {
        clue.onmouseenter = ev => {
            if (ev.target.parentElement.id == "spanner") highlight_horizontal(clue.firstElementChild.innerText[0]);
            else highlight_patch(parseInt(clue.firstElementChild.innerText))
        }
        clue.onmouseleave = ev => { clear_highlights(); }

        clue.onclick = ev => {
            let cells = reading_order(document.querySelectorAll(".highlighted"));
            select(cells.find(e => !get_letter(e)) ?? cells[0], clue.parentElement.id == "spanner" ? "horizontal" : "patch");
        }
    }

    for (let cell of document.querySelectorAll(".square")) {
        cell.onclick = ev => {
            if (cell == selected) toggle_dir();
            else select(cell, "horizontal");    
        }
    }

    document.body.onkeydown = ev => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ["INPUT", "TEXTAREA"].includes(ev.target.tagName)) return;

        if (ev.key == "Tab") {
            ev.preventDefault();
            if (!selected) select(squares()[0]);
            else step_clue(ev.shiftKey ? -1 : 1);
            return;
        }
        if (!selected) return;

        let char = ev.key.toUpperCase();
        if (ev.key.length == 1 && /[A-Z]/.test(char)) {
            type_letter(char);
        } else if (ev.key == "Backspace") {
            backspace();
        } else if (ev.key == "Delete") {
            set_letter(selected, "");
        } else if (ev.key == " ") {
            toggle_dir();
        } else if (ev.key in moves) {
            let [d_col, d_row] = moves[ev.key];
            let next = $(`${col_of(selected) + d_col};${row_of(selected) + d_row}`);
            if (next) select(next);
        } else {
            return;
        }
        ev.preventDefault();
    }
}