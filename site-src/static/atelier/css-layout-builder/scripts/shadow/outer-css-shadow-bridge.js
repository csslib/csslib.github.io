// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

class OuterCssShadowBridge {
  #shadowRoots = new Set();
  #isInitialized = false;

  registerRoot(shadowRoot) {
    this.#ensureInitialized();
    this.#shadowRoots.add(shadowRoot);
    this.syncRoot(shadowRoot);
  }

  unregisterRoot(shadowRoot) {
    this.#shadowRoots.delete(shadowRoot);
  }

  syncAllRoots() {
    const outerStyles = readOuterStyles();
    this.#shadowRoots.forEach((shadowRoot) => {
      applyOuterStylesToRoot(shadowRoot, outerStyles);
    });
  }

  syncRoot(shadowRoot) {
    applyOuterStylesToRoot(shadowRoot, readOuterStyles());
  }

  #ensureInitialized() {
    if (this.#isInitialized) return;
    this.#isInitialized = true;
    const headObserver = new MutationObserver(() => {
      this.syncAllRoots();
    });
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

export const shadowCssBridge = new OuterCssShadowBridge();

function readOuterStyles() {
  const cssText = Array.from(document.head.querySelectorAll('style'))
    .map(styleElement => styleElement.textContent + '\n')
    .join('');
  const stylesheetLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
  return { cssText, stylesheetLinks };
}

function applyOuterStylesToRoot(shadowRoot, { cssText, stylesheetLinks }) {
  syncOuterStyleText(shadowRoot, cssText);
  cloneMissingStylesheetLinks(shadowRoot, stylesheetLinks);
}

function syncOuterStyleText(shadowRoot, cssText) {
  let syncedStyle = shadowRoot.querySelector('style[data-synced-outer-css]');
  if (!syncedStyle) {
    syncedStyle = document.createElement('style');
    syncedStyle.setAttribute('data-synced-outer-css', 'true');
    shadowRoot.prepend(syncedStyle);
  }
  if (syncedStyle.textContent !== cssText) {
    syncedStyle.textContent = cssText;
  }
}

function cloneMissingStylesheetLinks(shadowRoot, stylesheetLinks) {
  let previousClone = null;
  stylesheetLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const existingClone = shadowRoot.querySelector(`link[data-synced-outer-link="${href}"]`);
    if (existingClone) {
      previousClone = existingClone;
      return;
    }
    const clone = link.cloneNode(true);
    clone.setAttribute('data-synced-outer-link', href);
    if (previousClone) previousClone.after(clone);
    else shadowRoot.prepend(clone);
    previousClone = clone;
  });
}
