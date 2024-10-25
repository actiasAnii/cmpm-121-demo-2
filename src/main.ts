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
canvas.height = 256;
canvas.width = 256;
canvas.id = "myCanvas";
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;

// drawable object interface
interface Drawable {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

// create marker line which is a drawable object
function createMarkerLine(startX: number, startY: number): Drawable {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }]; // array of canvas pts, start with where mouse is

  return {
    // returns object that has drag and display
    drag(x: number, y: number) {
      points.push({ x, y });
    },

    display(ctx: CanvasRenderingContext2D) {
      if (points.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    },
  };
}

// store drawn strokes for undo and and undone strokes redo
// stores them as drawables instead of arrays now
let strokesDrawn: Drawable[] = [];
let redoStack: Drawable[] = [];
let currentStroke: Drawable | null = null;

// redraw canvas function
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const drawable of strokesDrawn) {
    drawable.display(ctx);
  }
}

//////// handle mouse events

// start stroke on mousedown
canvas.addEventListener("mousedown", (e) => {
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke = createMarkerLine(point.x, point.y);
  strokesDrawn.push(currentStroke);
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// create stroke while mousemove
canvas.addEventListener("mousemove", (e) => {
  if (!currentStroke) return;
  currentStroke.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// stop drawing stroke on mouseup
canvas.addEventListener("mouseup", () => {
  currentStroke = null;
});

// whenever the drawing changes, redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

// Create button container
const buttonContainer = createElement("div", {
  styles: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(buttonContainer);

// clear button
const clearButton = createElement("button", {
  textContent: "Clear",
  styles: {
    marginTop: "10px",
  },
});
clearButton.addEventListener("click", () => {
  strokesDrawn = [];
  redoStack = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
});
buttonContainer.appendChild(clearButton);

// undo button
const undoButton = createElement("button", {
  textContent: "Undo",
  styles: {
    marginTop: "10px",
  },
});
buttonContainer.appendChild(undoButton);
undoButton.addEventListener("click", () => {
  if (strokesDrawn.length > 0) {
    const lastStroke = strokesDrawn.pop()!;
    redoStack.push(lastStroke); // push to redo stack
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// redo button
const redoButton = createElement("button", {
  textContent: "Redo",
  styles: {
    marginTop: "10px",
  },
});
buttonContainer.appendChild(redoButton);
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop()!;
    strokesDrawn.push(redoStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
