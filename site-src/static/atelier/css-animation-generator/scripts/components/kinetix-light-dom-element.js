// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { LitElement } from 'lit';

export class KinetixLightDomElement extends LitElement {
  static shadowRootOptions = { ...LitElement.shadowRootOptions, mode: 'open' };

  createRenderRoot() {
    return this;
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
  }
}
