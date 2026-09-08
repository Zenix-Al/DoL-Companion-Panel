export function injectCSS(css, root = document.head) {
  const style = document.createElement('style');
  style.textContent = css;
  root.appendChild(style);
}
