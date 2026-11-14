// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Abhishek Sengar

const RANDOM_ELEMENT_ID_MIN = 100;
const RANDOM_ELEMENT_ID_SPAN = 900;

export function createAnimationNode(id) {
  return {
    id,
    type: 'animation',
    title: 'New Animation / Transition',
    target: '.scene-card',
    cssMode: 'keyframes',
    duration: 600,
    delay: 40,
    stagger: 80,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    x: 620,
    y: 165,
    keyframes: [
      { offset: 0, translateX: 0, translateY: 32, scale: 0.9, rotate: 0, opacity: 0, blur: 4, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 },
      { offset: 100, translateX: 0, translateY: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 }
    ],
    outputs: [{ id: 'done', label: 'onComplete', targetIds: [] }]
  };
}

export function createWidthRouterNode(id) {
  return {
    id,
    type: 'condition',
    title: 'Multi-Width Range Router',
    conditionType: 'viewportRanges',
    x: 340,
    y: 165,
    ranges: [
      { id: 'r1', label: 'Mobile (0–767px)', min: 0, max: 767 },
      { id: 'r2', label: 'Tablet (768–1023px)', min: 768, max: 1023 },
      { id: 'r3', label: 'Desktop (1024–9999px)', min: 1024, max: 9999 }
    ],
    outputs: [
      { id: 'r1', label: '0–767px', targetIds: [] },
      { id: 'r2', label: '768–1023px', targetIds: [] },
      { id: 'r3', label: '1024–9999px', targetIds: [] }
    ]
  };
}

export function createMidpointKeyframe(offsetPercent) {
  return { offset: offsetPercent, translateX: 0, translateY: -10, scale: 1.05, rotate: 1, opacity: 1, blur: 0, useColors: false, bgColor: '#ffffff', textColor: '#0f172a', borderColor: '#e2e8f0', borderRadius: 12 };
}

export function createViewportRangesConditionPatch() {
  return {
    conditionType: 'viewportRanges',
    ranges: [
      { id: 'r-mob', label: 'Mobile (0–639px)', min: 0, max: 639 },
      { id: 'r-tab', label: 'Tablet (640–1023px)', min: 640, max: 1023 },
      { id: 'r-desk', label: 'Desktop (1024–9999px)', min: 1024, max: 9999 }
    ],
    outputs: [
      { id: 'r-mob', label: '0–639px', targetIds: [] },
      { id: 'r-tab', label: '640–1023px', targetIds: [] },
      { id: 'r-desk', label: '1024–9999px', targetIds: [] }
    ]
  };
}

export function createReducedMotionConditionPatch() {
  return {
    conditionType: 'reducedMotion',
    outputs: [
      { id: 'true', label: 'Reduced Motion ON', targetIds: [] },
      { id: 'false', label: 'Full Motion OK', targetIds: [] }
    ]
  };
}

export function createExtraWideRange(id) {
  return {
    range: { id, label: 'XL Screen (1280–9999px)', min: 1280, max: 9999 },
    output: { id, label: '1280–9999px', targetIds: [] }
  };
}

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createTimestampSuffix(digitCount) {
  return Date.now().toString().slice(-digitCount);
}

export function createRandomElementId() {
  return `el-${Math.floor(RANDOM_ELEMENT_ID_MIN + Math.random() * RANDOM_ELEMENT_ID_SPAN)}`;
}
