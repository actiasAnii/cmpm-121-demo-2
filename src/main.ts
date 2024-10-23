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
    } = {},
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    if (options.styles) Object.assign(element.style, options.styles);
    if (options.textContent) element.textContent = options.textContent;
    if (options.title) element.title = options.title;
    return element;
  }
  
  // append header element for title
  const title = createElement('h1', {
    textContent: "My Sketchpad App",
  });
  app.appendChild(title);
  
  // create and append canvas element
  const canvas = createElement('canvas', {});
  // had to change how height and width were assigned to fix drawing resolution
  canvas.height = 256;
  canvas.width = 256;
  // add an ID for styling in CSS and append
  canvas.id = "myCanvas";
  app.appendChild(canvas);

  // heavily referenced https://quant-paint.glitch.me/paint0.html below
  // drawing context
  const ctx = canvas.getContext("2d");

  // address possibility of canvas being null
  if (!ctx)
  {
    throw new Error("cannot initialize canvas 2D context");
  }

  // track whether the user is currently drawing
  let drawing = false;

// start drawing state on mousedown
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  ctx.beginPath(); // start new drawing path
  ctx.moveTo(e.offsetX, e.offsetY); // move the drawing cursor to mouse position
});

// draw on mousemove if the mouse is pressed
canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return; // if mouse is being held down
  ctx.lineTo(e.offsetX, e.offsetY); // draw to the current mouse position
  ctx.stroke(); // render
});

// stop drawing on mouseup or mouseleave
canvas.addEventListener('mouseup', () => {
  drawing = false;
});
canvas.addEventListener('mouseleave', () => {
  drawing = false;
});

// might make a container or reposition later
// add clear button
const clearButton = createElement('button', {
  textContent: 'clear',
  styles: {
    marginTop: '10px',
    padding: '10px',
    fontSize: '16px',
  },
});
// clear canvas when button is pressed
clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
app.appendChild(clearButton);

