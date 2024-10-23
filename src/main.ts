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

// store strokes as array of arrays of points {x, y}
let strokes: { x: number; y: number }[][] = [];
let currentStroke: { x: number; y: number }[] = [];

// track whether currently drawing
let drawing = false;

// function to redraw canvas
function redrawCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
  ctx!.beginPath();
  for (const stroke of strokes) {
    if (stroke.length === 0) continue; // skip empty strokes
    ctx!.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke) {
      ctx!.lineTo(point.x, point.y); // draw lines between points
    }
    ctx!.stroke();
  }
}

// start drawing state on mousedown
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentStroke = []; // start new stroke
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.push(point); // add start point
  strokes.push(currentStroke); // add stroke to array

  // dispatch drawing changed event
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// draw on mousemove if the mouse is pressed
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke.push(point); // add new point to current stroke

  // dispatch drawing changed event
  canvas.dispatchEvent(new Event("drawing-changed"));
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

// might make a container or reposition later
// add clear button
const clearButton = createElement("button", {
  textContent: "clear",
  styles: {
    marginTop: "10px",
    padding: "10px",
    fontSize: "16px",
  },
});
// clear canvas when button is pressed
clearButton.addEventListener("click", () => {
  strokes = [];
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
});
app.appendChild(clearButton);
