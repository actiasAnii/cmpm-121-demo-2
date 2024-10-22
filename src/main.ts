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
  const canvas = createElement('canvas', {
    styles: {
      width: '256px',
      height: '256px',
    },
  });
  canvas.id = "myCanvas";  // add an ID for styling in CSS
  app.appendChild(canvas);
