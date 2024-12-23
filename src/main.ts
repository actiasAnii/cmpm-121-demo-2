import "./style.css";

const APP_NAME = "Sketchpad Demo!";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

app.innerHTML = "CMPM 121 Demo 2"; // changed labels/titles

// interface for drawable things
interface Drawable {
  drag(x: number, y: number): void;
  display(ctx: CanvasRenderingContext2D): void;
  lineWidth: number;
  color: string;
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

// parameters
const THICK_MARKER_LINE_WIDTH: number = 5;
const THIN_MARKER_LINE_WIDTH: number = 1;
const STICKER_SIZE: number = 30;
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = 256;
const EXPORT_FACTOR: number = 4;

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

// helper function to export canvas when prompted
function exportCanvas() {
  // new temp canvas element
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = CANVAS_WIDTH * EXPORT_FACTOR;
  exportCanvas.height = CANVAS_HEIGHT * EXPORT_FACTOR;

  const exportCtx = exportCanvas.getContext("2d");

  exportCtx?.scale(4, 4); //scale by 4 to get 1024 from 256
  for (const drawable of strokesDrawn) {
    drawable.display(exportCtx!);
  }
  const dataURL = exportCanvas.toDataURL("image/png");

  // temporary link to trigger download
  const anchor = document.createElement("a");
  anchor.href = dataURL;
  anchor.download = "sketchpad_export.png";
  anchor.click();
  anchor.remove();
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
  const lineWidth = currentMarkerStyle === 
    "thin" ? THIN_MARKER_LINE_WIDTH : THICK_MARKER_LINE_WIDTH;
  const color = colorPicker.value;

  return {
    lineWidth,
    color,
    drag(x: number, y: number) {
      points.push({ x, y });
    },
    display(ctx: CanvasRenderingContext2D) {
      if (points.length === 0) return;
      ctx.lineWidth = this.lineWidth;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
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
    color: "#000000",
    drag(newX: number, newY: number) {
      x = newX;
      y = newY;
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = `${STICKER_SIZE}px Arial`;
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
      ctx.font = `${STICKER_SIZE}px Arial`;
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
      ctx.strokeStyle = colorPicker.value;
      ctx.globalAlpha = 0.75;
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
      thinButton.classList.remove("selectedTool");
      thickButton.classList.remove("selectedTool");
    });

    stickerContainer.appendChild(button);
  });
}

// DOM elements
const title = createElement("h1", { textContent: "Your Sketchpad" });
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
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;
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

// marker buttons
const thinButton = createElement("button", { textContent: "Thin Marker" });
thinButton.classList.add("selectedTool");
markerContainer.appendChild(thinButton);

thinButton.addEventListener("click", () => {
  currentMarkerStyle = "thin";
  currentTool = markerPreview();
  currentSticker = null;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
});

const thickButton = createElement("button", { textContent: "Thick Marker" });
markerContainer.appendChild(thickButton);

thickButton.addEventListener("click", () => {
  currentMarkerStyle = "thick";
  currentTool = markerPreview();
  currentSticker = null;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
});

const colorPicker = createElement("input", {
  styles: {
    marginTop: "10px",
    width: "60px",
    height: "30px",
  },
});
colorPicker.type = "color";
colorPicker.value = "#000000";
markerContainer.appendChild(colorPicker);

currentTool = markerPreview();

// sticker buttons
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
});
controlContainer.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  strokesDrawn = [];
  redoStack = [];
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
});

const undoButton = createElement("button", {
  textContent: "Undo",
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
});
controlContainer.appendChild(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoStroke = redoStack.pop()!;
    strokesDrawn.push(redoStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const exportButton = createElement("button", {
  textContent: "Export",
});
controlContainer.appendChild(exportButton);

exportButton.addEventListener("click", () => {
  exportCanvas();
});

// mouse event listeners
canvas.addEventListener("mousedown", (e) => {
  if (currentSticker) {
    const newSticker = placeSticker(currentSticker, e.offsetX, e.offsetY);
    strokesDrawn.push(newSticker);
    currentSticker = null;
    currentTool = markerPreview();
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

// Added instructions panel
const instructions = createElement("div", {
  styles: {
    marginTop: "15px",
    padding: "10px",
    maxWidth: "600px",
    backgroundColor: "#1a1a1a",
    border: "3px solid #ffffff",
    borderRadius: "10px",
    fontSize: "14px",
    lineHeight: "1.5",
    textAlign: "center",
    whiteSpace: "pre-wrap",
    boxSizing: "border-box",
    marginLeft: "auto",
    marginRight: "auto",
  },
  textContent: `
🎨 Welcome to this Sketchpad Demo! 🎨\n
- Use the "Thin Marker" or "Thick Marker" buttons to start drawing
- Pick a color with the color picker tool
- Add stickers by selecting one from below the brushes
- Or create your own with the "Custom Sticker" button
- Use the Undo/Redo buttons to manage your strokes
- Export your drawing as a PNG file with the Export button
- Clear to start over! \n
🌷 Have fun sketching! 🌷
  `,
});

app.append(instructions);

