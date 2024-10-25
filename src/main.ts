import "./style.css";

const APP_NAME = "Sketchpad Demo!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// drawable object interface
interface Drawable {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
  lineWidth: number;
}

let currentMarkerStyle: "thin" | "thick" = "thin"; // default to thin

function createMarkerLine(startX: number, startY: number): Drawable {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  const lineWidth = currentMarkerStyle === "thin" ? 1 : 5;

  return {
    lineWidth,
    drag(x: number, y: number) {
      points.push({ x, y });
    },
    display(ctx: CanvasRenderingContext2D) {
      if (points.length === 0) return;

      ctx.lineWidth = this.lineWidth;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    },
  };
}

// helper function to create DOM elements
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

const title = createElement("h1", {
  textContent: "My Sketchpad App",
});
app.appendChild(title);

// create container for marker select buttons
const markerContainer = createElement("div", {
  styles: {
    marginBottom: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(markerContainer);

// create canvas
const canvas = createElement("canvas", {});
canvas.height = 256;
canvas.width = 256;
canvas.id = "myCanvas";
app.appendChild(canvas);

// create general button container
const buttonContainer = createElement("div", {
  styles: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(buttonContainer);

const ctx = canvas.getContext("2d");

// stroke storage
let strokesDrawn: Drawable[] = [];
let redoStack: Drawable[] = [];
let currentStroke: Drawable | null = null;
let drawing = false;

function redrawCanvas() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  for (const drawable of strokesDrawn) {
    drawable.display(ctx!);
  }
}

///// Mouse event listeners

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const point = { x: e.offsetX, y: e.offsetY };
  currentStroke = createMarkerLine(point.x, point.y);
  strokesDrawn.push(currentStroke);
  redoStack = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing || !currentStroke) return;
  currentStroke.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  currentStroke = null;
});

// redraw canvas whenever there is change
canvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

//// buttons
const thinButton = createElement("button", {
  textContent: "Thin Marker",
});
thinButton.classList.add("selectedTool");

thinButton.addEventListener("click", () => {
  currentMarkerStyle = "thin";
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});
markerContainer.appendChild(thinButton);

const thickButton = createElement("button", {
  textContent: "Thick Marker",
});

thickButton.addEventListener("click", () => {
  currentMarkerStyle = "thick";
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});
markerContainer.appendChild(thickButton);

const clearButton = createElement("button", {
  textContent: "Clear",
  styles: {
    marginTop: "10px",
  },
});
clearButton.addEventListener("click", () => {
  strokesDrawn = [];
  redoStack = [];
  ctx!.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
});
buttonContainer.appendChild(clearButton);

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
