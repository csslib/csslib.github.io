// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

(() => {
  const SUITE_NAME = 'Atelier';
  const COLLECTION = { name: 'csslib', path: '../../' };
  const AUTHOR = { name: 'Abhishek Sengar', initials: 'AS', aboutPath: '../about/' };
  const SIBLING_PROJECTS = [{ name: 'Vektor.css', purpose: 'CSS charting library', path: '../vektor/' }];
  const SUITE_ROOT_URL = new URL('../', document.currentScript.src);
  const CURRENT_TOOL_ID = document.currentScript.dataset.tool || '';
  const MENU_ID = 'suite-menu';
  const MENU_GAP_PX = 8;
  const VIEWPORT_MARGIN_PX = 12;

  const SHAPE_PATHS = {
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    blob: '<path d="M12.6 3.2c3.9-.3 7.9 2.3 8.2 6.3.4 4.6-3.1 9.9-8.3 10.9-4.5.8-9-2-9.3-6.4-.3-4.1 2.9-5.4 4.2-7.6 1.2-2 2.3-3 5.2-3.2Z"/>',
    square: '<rect x="4" y="4" width="16" height="16"/>',
    triangle: '<path d="M12 3.5 21 19.5H3Z"/>'
  };

  const TOOLS = [
    { id: 'kinetix', name: 'Kinetix Studio', purpose: 'CSS animation generator', path: 'css-animation-generator/', detailPath: 'studios/css-animation-generator/', shape: 'circle' },
    { id: 'chromaflow', name: 'ChromaFlow', purpose: 'CSS gradient generator', path: 'css-gradient-generator/', detailPath: 'studios/css-gradient-generator/', shape: 'blob' },
    { id: 'specimen', name: 'Specimen Lab', purpose: 'CSS property playground', path: 'css-property-playground/', detailPath: 'studios/css-property-playground/', shape: 'square' },
    { id: 'intrinsicflow', name: 'IntrinsicFlow', purpose: 'CSS Grid & Flexbox layout builder', path: 'css-layout-builder/', detailPath: 'studios/css-layout-builder/', shape: 'triangle' }
  ];

  const currentTool = TOOLS.find((tool) => tool.id === CURRENT_TOOL_ID);

  markDocumentWithCurrentTool(currentTool);
  window.AtelierSuite = { name: SUITE_NAME, tools: TOOLS, rootUrl: SUITE_ROOT_URL.href };
  customElements.define('suite-nav', createSuiteNavElement());

  function markDocumentWithCurrentTool(tool) {
    if (!tool) return;
    document.documentElement.dataset.suiteTool = tool.id;
  }

  function resolveUrl(path) {
    return new URL(path, SUITE_ROOT_URL).href;
  }

  function toolColorStyle(tool) {
    return `--tool-color: rgb(var(--${tool.id}-600-rgb)); --tool-tint: rgb(var(--${tool.id}-50-rgb)); --tool-glyph: rgb(var(--${tool.id}-500-rgb))`;
  }

  function renderShape(shape) {
    return `<svg class="suite-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SHAPE_PATHS[shape]}</svg>`;
  }

  function renderSuiteMark() {
    return `<svg class="suite-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="6" style="fill: rgb(var(--${TOOLS[0].id}-500-rgb))"/>
      <path d="M22.4 3.6c3.3-.2 6 2 6.1 5 .1 3.6-2.6 6.9-6.3 7.1-3.1.2-6-2-6.1-5-.1-3.4 3-6.9 6.3-7.1Z" style="fill: rgb(var(--${TOOLS[1].id}-500-rgb))"/>
      <rect x="4" y="18" width="12" height="11" style="fill: rgb(var(--${TOOLS[2].id}-500-rgb))"/>
      <path d="M22.5 17.5 29 29H16Z" style="fill: rgb(var(--${TOOLS[3].id}-500-rgb))"/>
    </svg>`;
  }

  function renderChevron() {
    return '<svg class="suite-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4"/></svg>';
  }

  function renderSwitcherButton(tool) {
    return `<button class="suite-switcher" type="button" popovertarget="${MENU_ID}" aria-haspopup="true" aria-expanded="false" style="${toolColorStyle(tool)}" title="Switch studio">
      <span class="suite-switcher-tile">${renderShape(tool.shape)}</span>
      <span class="suite-switcher-name">${tool.name}</span>
      ${renderChevron()}
    </button>`;
  }

  function renderMenuStudio(tool) {
    const isCurrent = tool.id === CURRENT_TOOL_ID;
    return `<li>
      <a class="suite-menu-studio${isCurrent ? ' is-current' : ''}" href="${resolveUrl(tool.path)}" style="${toolColorStyle(tool)}"${isCurrent ? ' aria-current="page"' : ''}>
        <span class="suite-menu-tile">${renderShape(tool.shape)}</span>
        <span class="suite-menu-text"><strong>${tool.name}</strong><small>${tool.purpose}</small></span>
        ${isCurrent ? '<span class="suite-menu-badge">Current</span>' : ''}
      </a>
    </li>`;
  }

  function renderMenu(tool) {
    return `<div class="suite-menu" id="${MENU_ID}" popover>
      <p class="suite-menu-heading">Studios</p>
      <ul class="suite-menu-studios">${TOOLS.map(renderMenuStudio).join('')}</ul>
      <div class="suite-menu-links">
        <a href="${resolveUrl(tool.detailPath)}">How ${tool.name} works</a>
        <a href="${SUITE_ROOT_URL.href}">${SUITE_NAME} home <small>All four studios</small></a>
      </div>
      <p class="suite-menu-heading">More from ${COLLECTION.name}</p>
      <div class="suite-menu-links is-collection">
        ${SIBLING_PROJECTS.map((project) => `<a href="${resolveUrl(project.path)}">${project.name} <small>${project.purpose}</small></a>`).join('')}
        <a href="${resolveUrl(COLLECTION.path)}">${COLLECTION.name} home <small>All projects</small></a>
      </div>
      <a class="suite-menu-author" href="${resolveUrl(AUTHOR.aboutPath)}">
        <span class="suite-avatar" aria-hidden="true">${AUTHOR.initials}</span>
        <span class="suite-menu-text"><strong>Made by ${AUTHOR.name}</strong><small>About ${COLLECTION.name} &amp; contact</small></span>
      </a>
    </div>`;
  }

  function renderAuthorLink() {
    return `<a class="suite-author" href="${resolveUrl(AUTHOR.aboutPath)}" title="Made by ${AUTHOR.name}" aria-label="About ${AUTHOR.name}, maker of ${SUITE_NAME}">
      <span class="suite-avatar" aria-hidden="true">${AUTHOR.initials}</span>
    </a>`;
  }

  function createSuiteNavElement() {
    return class SuiteNav extends HTMLElement {
      connectedCallback() {
        if (!currentTool) return;
        this.innerHTML = `<nav class="suite-nav" aria-label="${SUITE_NAME}">
          <a class="suite-home" href="${SUITE_ROOT_URL.href}" title="${SUITE_NAME} home" aria-label="${SUITE_NAME} home">${renderSuiteMark()}</a>
          ${renderSwitcherButton(currentTool)}
          ${renderMenu(currentTool)}
          ${renderAuthorLink()}
        </nav>`;
        this.dataset.suiteTool = currentTool.id;
        this.closest('.suite-header')?.setAttribute('data-suite-tool', currentTool.id);
        bindMenuPositioning(this);
      }
    };
  }

  function bindMenuPositioning(navElement) {
    const switcher = navElement.querySelector('.suite-switcher');
    const menu = navElement.querySelector('.suite-menu');
    if (!menu.showPopover) return;
    menu.addEventListener('beforetoggle', (event) => {
      const isOpening = event.newState === 'open';
      switcher.setAttribute('aria-expanded', String(isOpening));
      if (isOpening) placeMenuBelow(switcher, menu);
    });
  }

  function placeMenuBelow(anchor, menu) {
    const anchorRect = anchor.getBoundingClientRect();
    const menuWidth = Math.min(menu.offsetWidth || 320, window.innerWidth - VIEWPORT_MARGIN_PX * 2);
    const left = Math.min(Math.max(VIEWPORT_MARGIN_PX, anchorRect.left), window.innerWidth - menuWidth - VIEWPORT_MARGIN_PX);
    menu.style.top = `${anchorRect.bottom + MENU_GAP_PX}px`;
    menu.style.left = `${left}px`;
  }
})();
