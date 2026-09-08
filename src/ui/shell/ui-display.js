import { getUiRefs } from './dom-query.js';

export function hideAllContent() {
  const { quicklink, statlink, misclink, quickcontent, statscontent, misccontent } = getUiRefs();
  if (!quicklink || !statlink || !misclink || !quickcontent || !statscontent || !misccontent) {
    return;
  }

  [quicklink, statlink, misclink].forEach((link) => link.classList.remove('gold'));
  [quickcontent, statscontent, misccontent].forEach((content) =>
    content.classList.remove('active')
  );
}

export function showContent(nav, contentElement) {
  if (!nav || !contentElement) return;
  hideAllContent();
  nav.classList.add('gold');
  contentElement.classList.add('active');
}
