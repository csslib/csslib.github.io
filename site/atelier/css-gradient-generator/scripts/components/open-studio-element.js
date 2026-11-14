// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { LitElement } from 'lit';

export class OpenStudioElement extends LitElement {
  createRenderRoot() {
    return this;
  }

  _emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true }));
  }
}
