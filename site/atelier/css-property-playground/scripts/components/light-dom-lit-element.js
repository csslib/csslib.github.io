// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { LitElement } from 'lit';

export class LightDomLitElement extends LitElement {
  createRenderRoot() {
    return this;
  }
}
