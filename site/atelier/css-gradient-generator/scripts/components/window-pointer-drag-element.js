// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

import { OpenStudioElement } from './open-studio-element.js';

export class WindowPointerDragElement extends OpenStudioElement {
  constructor() {
    super();
    this._handleWindowPointerMove = this._handleWindowPointerMove.bind(this);
    this._handleWindowPointerUp = this._handleWindowPointerUp.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('pointermove', this._handleWindowPointerMove);
    window.addEventListener('pointerup', this._handleWindowPointerUp);
  }

  disconnectedCallback() {
    window.removeEventListener('pointermove', this._handleWindowPointerMove);
    window.removeEventListener('pointerup', this._handleWindowPointerUp);
    super.disconnectedCallback();
  }

  _handleWindowPointerMove() {}

  _handleWindowPointerUp() {}
}
