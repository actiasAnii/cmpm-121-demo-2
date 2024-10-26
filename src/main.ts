import "./style.css";

const APP_NAME = "Sketchpad Demo!";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// interface for drawable things
interface Drawable {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
  lineWidth: number;
}

// interface for tool preview behavior
interface ToolPreview {
  drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

// global variables
let currentMarkerStyle: "thin" | "thick" = "thin";
let currentSticker: string | null = null;
let currentTool: ToolPreview | null = null;
let strokesDrawn: Drawable[] = [];
let redoStack: Drawable[] = [];
let currentStroke: Drawable | null = null;
let drawing = false;
let previewX: number | null = null;
let previewY: number | null = null;

// extendable array of stickers
// deno-lint-ignore prefer-const
let stickers: string[] = ["❤️", "✨", "🌷"];

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

// helper function to redraw all drawables onto canvas
function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const drawable of strokesDrawn) {
    drawable.display(ctx);
  }
}

// draw things
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
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.stroke();
    },
  };
}

function placeSticker(
  sticker: string,
  startX: number,
  startY: number
): Drawable {
  let x = startX;
  let y = startY;

  return {
    lineWidth: 0,
    drag(newX: number, newY: number) {
      x = newX;
      y = newY;
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 1;
      ctx.fillText(sticker, x, y);
    },
  };
}

// preview tools
function stickerPreview(sticker: string): ToolPreview {
  return {
    drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.5;
      ctx.fillText(sticker, x, y);
    },
  };
}

function markerPreview(): ToolPreview {
  return {
    drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number) {
      const lineWidth = currentMarkerStyle === "thin" ? 1 : 3;
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(x, y, lineWidth * 2, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
}

// helper function for making sticker buttons
function createStickerButtons() {
  stickers.forEach((sticker) => {
    const button = createElement("button", {
      textContent: sticker,
      styles: { fontSize: "24px" },
    });

    button.addEventListener("click", () => {
      currentSticker = sticker;
      currentTool = stickerPreview(sticker);
    });

    stickerContainer.appendChild(button);
  });
}

// DOM elements
const title = createElement("h1", { textContent: "My Sketchpad App" });
app.appendChild(title);

const markerContainer = createElement("div", {
  styles: {
    marginBottom: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(markerContainer);

const stickerContainer = createElement("div", {
  styles: {
    marginTop: "10px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(stickerContainer);

const canvas = createElement("canvas", {});
canvas.height = 256;
canvas.width = 256;
canvas.id = "myCanvas";
app.appendChild(canvas);

const controlContainer = createElement("div", {
  styles: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
});
app.appendChild(controlContainer);

const ctx = canvas.getContext("2d");

const thinButton = createElement("button", { textContent: "Thin Marker" });
thinButton.classList.add("selectedTool");
markerContainer.appendChild(thinButton);

thinButton.addEventListener("click", () => {
  currentMarkerStyle = "thin";
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

const thickButton = createElement("button", { textContent: "Thick Marker" });
markerContainer.appendChild(thickButton);

thickButton.addEventListener("click", () => {
  currentMarkerStyle = "thick";
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});

currentTool = markerPreview();
createStickerButtons();

const customStickerButton = createElement("button", {
  textContent: "Custom Sticker",
});
stickerContainer.appendChild(customStickerButton);

customStickerButton.addEventListener("click", () => {
  const newSticker = prompt("Enter a new sticker:", "🎉");
  if (newSticker) {
    stickers.push(newSticker);
    stickerContainer.innerHTML = "";
    createStickerButtons();
    stickerContainer.appendChild(customStickerButton);
  }
});

// control buttons
const clearButton = createElement("button", {
  textContent: "Clear",
  styles: { marginTop: "10px" },
});
controlContainer.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  strokesDrawn = [];
  redoStack = [];
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
});

const undoButton = createElement("button", {
  textContent: "Undo",
  styles: { marginTop: "10px" },
});
controlContainer.appendChild(undoButton);

undoButton.addEventListener("click", () => {
  if (strokesDrawn.length > 0) {
    const lastStroke = strokesDrawn.pop()!;
    redoStack.push(lastStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = createElement("button", {
  textContent: "Redo",
  styles: { marginTop: "10px" },
});
controlContainer.appendChild(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop()!;
    strokesDrawn.push(redoStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// mouse event listeners
canvas.addEventListener("mousedown", (e) => {
  if (currentSticker) {
    const newSticker = placeSticker(currentSticker, e.offsetX, e.offsetY);
    strokesDrawn.push(newSticker);
    currentSticker = null;
    currentTool = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    drawing = true;
    const point = { x: e.offsetX, y: e.offsetY };
    currentStroke = createMarkerLine(point.x, point.y);
    strokesDrawn.push(currentStroke);
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing && currentTool) {
    previewX = e.offsetX;
    previewY = e.offsetY;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas(ctx!, canvas);
    if (previewX !== null && previewY !== null) {
      currentTool.drawPreview(ctx!, previewX, previewY);
    }
  } else if (drawing && currentStroke) {
    currentStroke.drag(e.offsetX, e.offsetY);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    redrawCanvas(ctx!, canvas);
    currentStroke.display(ctx!);
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  currentStroke = null;
});

canvas.addEventListener("drawing-changed", () => {
  redrawCanvas(ctx!, canvas);
});
