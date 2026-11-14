// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const MIN_VIEWPORT_WIDTH_PX = 320;
const MAX_VIEWPORT_WIDTH_PX = 1360;

export function clampViewportWidth(width) {
  return Math.max(MIN_VIEWPORT_WIDTH_PX, Math.min(MAX_VIEWPORT_WIDTH_PX, Math.round(width)));
}

export function indentEachLine(text, indent) {
  return text.split('\n').map(line => indent + line).join('\n');
}

export function createOffscreenTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  return textarea;
}
