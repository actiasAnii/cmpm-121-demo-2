import "./style.css";

const APP_NAME = "Sketchpad Demo !";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// reuse the helper function from my demo 1 to create the title and canvas
function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    styles?: Partial<CSSStyleDeclaration>;
    textContent?: string;
    title?: string;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (options.styles) Object.assign(element.style, options.styles);
  if (options.textContent) element.textContent = options.textContent;
  if (options.title) element.title = options.title;
  return element;
}

// append header element for title
const title = createElement("h1", {
  textContent: "My Sketchpad App",
});
app.appendChild(title);

// create and append canvas element
const canvas = createElement("canvas", {});
// had to change how height and width were assigned to fix drawing resolution
canvas.height = 256;
canvas.width = 256;
// add an ID for styling in CSS and append
canvas.id = "myCanvas";
app.appendChild(canvas);

// heavily referenced https://quant-paint.glitch.me/paint0.html below
// drawing context
const ctx = canvas.getContext("2d");

// store strokes drawn as array of arrays of points {x, y}
let strokesDrawn: { x: number; y: number }[][] = [];
let redoStack: { x: number; y: number }[][] = [];
let currentStroke: { x: number; y: number }[] = [];

// track whether currently drawing
let drawing = false;

// function to redraw canvas
function redrawCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  ctx!.beginPath();
  for (const stroke of strokesDrawn) {
    if (stroke.length === 0) continue; // skip empty strokes
    ctx!.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke) {
      ctx!.lineTo(point.x, point.y); // draw lines between points
    }
    ctx!.stroke();
  }
}

//////// handle mouse events

// start drawing state on mousedown
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentStroke = []; // start new stroke
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.push(point); // add start point
  strokesDrawn.push(currentStroke); // add stroke to array
  redoStack = []; // clear to separate strokes
  canvas.dispatchEvent(new Event("drawing-changed")); // trigger redraw
});

// draw on mousemove if the mouse is pressed
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.push(point); // add new point to current stroke
  canvas.dispatchEvent(new Event("drawing-changed")); // trigger redraw
});

// stop drawing on mouseup
canvas.addEventListener("mouseup", () => {
  drawing = false;
});
// decided i dont like stopping on mouseleave

// listen for the drawing changed event to redraw canvas
canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

//////// buttons

// make button container
const buttonContainer = createElement("div", {
  styles: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(buttonContainer);

// add clear button
const clearButton = createElement("button", {
  textContent: "Clear",
  styles: {
    marginTop: "10px",
  },
});
// clear canvas when button is pressed
clearButton.addEventListener("click", () => {
  //clear everything
  strokesDrawn = [];
  redoStack = [];
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
});
buttonContainer.appendChild(clearButton);

// add undo button
const undoButton = createElement("button", {
  textContent: "Undo",
  styles: {
    marginTop: "10px",
  },
});
buttonContainer.appendChild(undoButton);
// undo most recent stroke
undoButton.addEventListener("click", () => {
  if (strokesDrawn.length > 0) {
    const lastStroke = strokesDrawn.pop()!; // remove the last stroke from strokes
    redoStack.push(lastStroke); // push to the redo stack
    canvas.dispatchEvent(new Event("drawing-changed")); // trigger redraw
  }
});

// add redo button
const redoButton = createElement("button", {
  textContent: "Redo",
  styles: {
    marginTop: "10px",
  },
});
buttonContainer.appendChild(redoButton);
// redo most recently undone stroke
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop()!; // pop last stroke from redo stack
    strokesDrawn.push(redoStroke); // add back to strokes drawn array
    canvas.dispatchEvent(new Event("drawing-changed")); // trigger redraw
  }
});
