// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const NEW_TEXT_SHADOW_LAYER = { blur: 8, color: '#6366f1', alpha: 0.75 };
const NEW_BOX_SHADOW_LAYER = { x: 0, blur: 24, spread: -4, color: '#4f46e5', alpha: 0.2, inset: false };
const NEW_BOX_SHADOW_BASE_Y_PX = 12;
const NEW_BOX_SHADOW_Y_STEP_PX = 8;
const NEW_TEXT_SHADOW_OFFSET_STEP_PX = 2;

export function createTextShadowLayer(existingLayerCount) {
  const offsetPx = (existingLayerCount + 1) * NEW_TEXT_SHADOW_OFFSET_STEP_PX;
  return { x: offsetPx, y: offsetPx, ...NEW_TEXT_SHADOW_LAYER };
}

export function createBoxShadowLayer(existingLayerCount) {
  const { x, ...layerStyle } = NEW_BOX_SHADOW_LAYER;
  return { x, y: NEW_BOX_SHADOW_BASE_Y_PX + existingLayerCount * NEW_BOX_SHADOW_Y_STEP_PX, ...layerStyle };
}

export function wrapInElementRule(cssDeclaration) {
  return `.element {\n  ${cssDeclaration.replace(/\n/g, '\n  ')}\n}`;
}
