// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { LitElement } from 'lit';
import { shadowCssBridge } from '../shadow/outer-css-shadow-bridge.js';

export class OpenShadowElement extends LitElement {
  createRenderRoot() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowCssBridge.registerRoot(shadowRoot);
    return shadowRoot;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (!this.shadowRoot) return;
    shadowCssBridge.syncRoot(this.shadowRoot);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (!this.shadowRoot) return;
    shadowCssBridge.unregisterRoot(this.shadowRoot);
  }

  emitComposedEvent(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
}
